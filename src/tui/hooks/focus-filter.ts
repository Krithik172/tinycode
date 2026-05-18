const { PassThrough } = await import("node:stream");

const FOCUS_REPORT_START = 27;
const FOCUS_REPORT_OPEN = 91;
const FOCUS_GAINED = 73;
const FOCUS_LOST = 79;

class FocusFilterStream extends PassThrough {
  private _state: "idle" | "sawEscape" | "sawEscapeBracket" = "idle";
  private _onFocusChange: (focused: boolean) => void;
  private _stdin: NodeJS.ReadStream;

  constructor(
    stdin: NodeJS.ReadStream,
    onFocusChange: (focused: boolean) => void,
  ) {
    super();
    this._stdin = stdin;
    this._onFocusChange = onFocusChange;
  }

  override _transform(chunk: Buffer, _encoding: string, callback: () => void) {
    for (const byte of chunk) {
      switch (this._state) {
        case "idle":
          if (byte === FOCUS_REPORT_START) {
            this._state = "sawEscape";
          } else {
            super.push(Buffer.from([byte]));
          }
          break;
        case "sawEscape":
          if (byte === FOCUS_REPORT_OPEN) {
            this._state = "sawEscapeBracket";
          } else {
            super.push(Buffer.from([FOCUS_REPORT_START, byte]));
            this._state = "idle";
          }
          break;
        case "sawEscapeBracket":
          if (byte === FOCUS_GAINED) {
            this._onFocusChange(true);
          } else if (byte === FOCUS_LOST) {
            this._onFocusChange(false);
          } else {
            super.push(Buffer.from([FOCUS_REPORT_START, FOCUS_REPORT_OPEN, byte]));
          }
          this._state = "idle";
          break;
      }
    }
    callback();
  }

  override setRawMode(mode: boolean) {
    this._stdin.setRawMode?.(mode);
  }

  ref() {
    this._stdin.ref?.();
  }

  unref() {
    this._stdin.unref?.();
  }

  get isTTY(): boolean {
    return true;
  }

  get isRaw(): boolean {
    return this._stdin.isRaw;
  }
}

let globalOnFocusChange: ((focused: boolean) => void) | null = null;

export function enableFocusFilter(): FocusFilterStream {
  const filter = new FocusFilterStream(process.stdin, (focused) => {
    globalOnFocusChange?.(focused);
  });

  process.stdin.pipe(filter);

  return filter;
}

export function setFocusChangeListener(
  listener: ((focused: boolean) => void) | null,
) {
  globalOnFocusChange = listener;
}
