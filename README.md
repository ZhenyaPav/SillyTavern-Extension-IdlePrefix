# Idle Prefix Extension for SillyTavern

Adds an optional prefix to user messages when the chat has been idle longer than a configured threshold.

## Features

- Threshold in minutes (default: 5)
- Editable prefix template (default: `*{{idle_duration}} passed*`)
- `{{idle_duration}}` is rendered in the same humanized style as SillyTavern's macro output

## Installation

### Install via the Extensions UI

1. Open **Extensions** in SillyTavern.
2. Click **Install extension**.
3. Paste your Git repository URL for this extension and install it.
4. Enable **Idle Prefix** in the Extensions list.

### Manual install

Clone this repo into your extensions folder:

- Per-user: `data/<your-user-handle>/extensions/Extension-Idle-Prefix`
- For all users: `public/scripts/extensions/third-party/Extension-Idle-Prefix`

Then open **Extensions** in SillyTavern and enable **Idle Prefix**.

## Configuration

Open **Extensions** and expand **Idle Prefix**:

- **Idle threshold (minutes)**: messages sent after this many minutes of inactivity get the prefix.
- **Prefix template**: text to add before the message. Leave blank to disable.

`{{idle_duration}}` is replaced with a humanized duration (e.g., "a few minutes", "an hour").
You can also use other SillyTavern macros in the template.
