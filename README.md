# Search Focus Guard

Search Focus Guard is an unpacked Chrome extension that searches visible page text, highlights matches, and scrolls to them.
<p align = "center">
<img width="500" height="43" alt="image" src="https://github.com/user-attachments/assets/eb3808d1-166e-4a70-b7ce-fe145c3081da" />


## Features

- Counts and highlights text matches on the current page.
- Scrolls to the first match and lets you move through results with **Enter** or the previous/next buttons.
- Saves the last query and supports a configurable default query in the extension popup.
- Refreshes results when page content changes.
- Searches the regular DOM, open Shadow DOM roots, and same-origin frames it can access.
- Requests Chrome's built-in leave-page confirmation when there is at least one match.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+E` | Open Search Focus Guard (suggested extension shortcut; configurable at `chrome://extensions/shortcuts`) |
| `Ctrl+V` | With the optional AutoHotkey macro running and Chrome focused, send `Ctrl+Shift+E`, then `Right` |
| `Enter` | Move to the next match while the search field is focused |
| `Shift+Enter` | Move to the previous match while the search field is focused |
| `Esc` | Close the search bar |

The macro intercepts `Ctrl+V` in Chrome, so that shortcut will not paste from the clipboard there.

## Set a default search

Open the extension popup, enter a value under **Default search text**, and select **Save text**. The extension loads it whenever the search bar opens. Leave it empty to reuse the last query.
<p align = "center">
<img width="300" height="220" alt="image" src="https://github.com/user-attachments/assets/5cc1cd55-9cdb-45bd-a466-a1a72ea86718" />


## Install the extension

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the folder containing `manifest.json`.
5. Optionally assign or change the extension shortcut at `chrome://extensions/shortcuts`.

You can also open the search bar from the extension icon.

## Optional AutoHotkey macro

`Active Search Focus Guard.ahk` is separate from the extension and requires AutoHotkey v2. Run it independently. While Chrome is active, it maps `Ctrl+V` to the extension shortcut and sends `Right` after a short delay. That synthetic keyboard input may count as page interaction in Chrome and allow the native leave-page confirmation to appear when matches exist, but Chrome decides whether to show the dialog and this is not guaranteed. The macro does **not** block `Ctrl+W`.

## Closing tabs and Chrome limitations

When there is at least one match, the extension requests Chrome's native leave-page confirmation. Chrome controls whether that confirmation is shown, may require prior user interaction with the page, and still lets the user confirm leaving. Neither this extension nor its included macro currently blocks `Ctrl+W` conditionally based on search results. There is no reliable extension API to prevent Chrome from closing a tab.

Chrome also restricts access to internal pages such as `chrome://` and the Chrome Web Store. The extension cannot read closed Shadow DOM roots or cross-origin frames. Its search bar is independent of Chrome's native `Ctrl+F` find bar.

## License

See `LICENSE.txt` in the repository root for the terms that apply to this project.
