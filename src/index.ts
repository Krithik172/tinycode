import { render } from "ink";
import { createElement } from "react";
import { App } from "./tui/app.js";

const { waitUntilExit } = render(createElement(App));
await waitUntilExit();
