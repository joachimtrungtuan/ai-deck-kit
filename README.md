# AI Deck Kit

Build presentations with an AI agent instead of a slide editor.

You describe what you want; your AI coding agent (Claude Code, Codex, …) writes the
content and the toolkit turns it into real, reviewable slides in your browser. Every
deck is a plain folder inside **your own project**, so it travels with the work it
belongs to.

The kit installs **into a project folder**, not into your whole computer. Install it
in as many projects as you like — each keeps its own copy and its own version.

- **New here? Follow this page top to bottom.** Every command is written out in full.
- **In a hurry?** Jump to [Install](#2-install-the-kit) then [Your first deck](#5-make-your-first-presentation).

---

## 1. Before you install

The kit needs a few pieces of free software. Check what you already have by pasting
this into your terminal (Terminal on macOS/Linux, PowerShell on Windows) and pressing
Enter:

```sh
node --version
npm --version
git --version
```

You need:

| Software | Needed version | What it is for |
| --- | --- | --- |
| **Node.js** | 22.6.0 or newer | Runs the toolkit. **Required.** |
| **npm** | any (ships with Node) | Fetches the toolkit's parts. **Required.** |
| **git** | any | Downloads the toolkit from GitHub. **Required.** |
| Google Chrome | any | Only for exporting to PDF. Optional. |
| ImageMagick | any | Only for image processing in some templates. Optional. |

If a command answers `command not found`, or Node reports a version below 22.6.0,
install it first:

- **Node.js and npm** — download the "LTS" installer from <https://nodejs.org> and run
  it. This installs both. Close and reopen your terminal afterwards.
- **git** — macOS: run `xcode-select --install`. Windows: download from
  <https://git-scm.com/download/win>. Linux: `sudo apt install git` (or your
  distribution's package manager).
- **Google Chrome** — <https://www.google.com/chrome/>. Skip it if you never need PDFs.

You do not have to get this perfect. The installer checks all of it again and tells
you, in plain words, exactly what is missing before it changes anything.

---

## 2. Install the kit

Move into the folder where you want your presentations to live. If you do not have
one yet, create it:

```sh
mkdir my-presentations
cd my-presentations
```

Then run the installer:

```sh
npx github:joachimtrungtuan/ai-deck-kit init --here
```

`npx` downloads the toolkit from GitHub and runs it once — nothing is installed
system-wide by this step. Say yes if it asks permission to download the package.

The installer will:

1. Check the software listed above and stop with clear instructions if anything is missing.
2. Copy the toolkit into your folder.
3. Download the toolkit's components (this can take a minute).
4. Ask where to connect the AI skills — see [step 3](#3-connect-the-ai-skills).
5. Offer to register the `aideck` command — see [step 4](#4-make-aideck-typeable).

**Options**

```sh
# Keep the toolkit in a subfolder instead of the project root:
npx github:joachimtrungtuan/ai-deck-kit init --dir tools/ai-deck-kit

# Install a specific released version:
npx github:joachimtrungtuan/ai-deck-kit#v0.1.0 init --here

# Continue even if the software check fails (not recommended):
npx github:joachimtrungtuan/ai-deck-kit init --here --skip-checks
```

### What you end up with

```
my-presentations/
├── ai-deck-kit.json   ← marks this folder as a deck workspace
├── aideck             ← launcher, so ./aideck always works here
├── .gitignore         ← keeps the installed engine out of version control
├── engine/            ← the toolkit itself. Upgradable — leave it alone.
├── decks/             ← YOUR presentations live here
└── templates/         ← YOUR own designs live here
```

`decks/` and `templates/` are yours. Upgrading the kit never touches them.

If you keep this folder in git, the installer sets up `.gitignore` for you: the engine
and build output are left out (anyone can reinstall them), while your decks and
`ai-deck-kit.json` are **not** ignored, so your work is committed as usual. An existing
`.gitignore` is added to, never replaced.

---

## 3. Connect the AI skills

The kit teaches your AI agent how to build decks by placing *skills* in the agent's
folder — `.claude` for Claude Code, `.agents` for other agents.

- If your project **already has** a `.claude` or `.agents` folder next to where you
  installed, the skills are connected automatically.
- If you installed **deep inside** a larger project, the installer looks upward for
  the agent folder and asks whether to use the one it found, lets you type a
  different path, or lets you skip.

You can do this at any later time:

```sh
aideck skills wire                       # find the agent folder and ask
aideck skills wire --to ../../.claude    # use exactly this folder
```

Existing folders of your own are never overwritten.

---

## 4. Make `aideck` typeable

Without registration you run the toolkit as `./aideck` from your project folder.
That always works and requires nothing extra.

Registering lets you simply type `aideck` from anywhere:

```sh
aideck link      # register (one time, for this computer)
aideck unlink    # undo it
```

**This is safe to do once and forget.** What gets registered is a tiny launcher that
looks for the nearest `ai-deck-kit.json` and hands over to *that* project's engine.
So:

- Register **once**, and it works in every deck project you create afterwards.
- You never re-register when you move a folder, install into a new project, or
  upgrade a project's engine.
- Each project keeps running its own engine version. One project's upgrade cannot
  change another project's output.

If registration reports that the folder is not on your `PATH`, it prints the exact
line to run to fix it. Until you do, use `./aideck` instead.

> Everything else stays project-scoped: your decks, designs, and the toolkit itself
> never leave the project folder.

---

## 5. Make your first presentation

```sh
aideck new my-talk --template swiss-modern
```

This creates `decks/my-talk.deck/`, containing:

- `content.md` — **the one file that holds your words.** Text, images, speaker notes.
- `deck.json` — which template and slide types the deck uses.
- `assets/` — images and other files you add.
- `template/` — a snapshot of the design, so the deck always renders the same way.

Three designs ship with the kit:

```sh
aideck template list
```

| Template | Best for |
| --- | --- |
| `swiss-modern` | Clean, typographic business decks |
| `linear-dark` | Dark, product-launch style decks |
| `clarity-courseware` | Teaching and training material |

**Now hand it to your agent.** Open your AI agent in this folder and ask for what you
want, for example: *"Fill in my-talk with a 10-slide pitch for our Q3 launch."* The
agent edits `content.md` and the slide structure for you. You review the result in
the browser (next step) and ask for changes in plain language.

---

## 6. See it in your browser

```sh
aideck serve --deck my-talk
```

Your browser opens with the deck. Leave it running while you and the agent work —
it refreshes as the content changes. Press `Ctrl + C` in the terminal to stop.

```sh
aideck serve                          # gallery of all installed templates
aideck serve --template swiss-modern  # preview a design on its own
aideck serve --deck my-talk --port 4000
aideck serve --deck my-talk --no-open # do not open a browser window
```

The preview is read-only: you cannot break a deck by clicking around in it.

---

## 7. Come back to earlier work

Nothing is stored in a session, so picking up where you left off is just:

```sh
cd my-presentations   # the folder you installed into
aideck list           # every deck, its status, template and slide count
aideck serve --deck my-talk
```

`aideck list` is the fastest way to remember what you have. To continue with your
agent, open it in this folder and name the deck — the skills and the deck's own
`content.md` carry all the context it needs.

Working on a design rather than a deck:

```sh
aideck template new my-brand        # start your own design in templates/
aideck serve --template my-brand    # review it
aideck template register my-brand   # check it and install it for use in decks
```

---

## 8. Export and share

```sh
aideck export html my-talk   # one self-contained file, opens in any browser
aideck export pdf my-talk    # flattened PDF (needs Chrome)
```

Both land in `decks/my-talk.deck/.build/export/`.

To hand the whole deck — content, images and design — to someone else:

```sh
aideck pack my-talk                            # creates decks/my-talk.deck.zip
aideck unpack decks/my-talk.deck.zip --to decks
```

Packing uses the `zip` command, which macOS and most Linux systems already have.

---

## 9. Keeping the toolkit current

```sh
aideck upgrade              # latest engine
aideck upgrade --to 0.2.0   # a specific version
```

Only `engine/` is replaced. Your `decks/` and `templates/` are never copied, moved,
or rewritten. After upgrading, the kit runs its own health check and reports any deck
that expects an older format — it will not silently rewrite your content.

---

## 10. If something goes wrong

Run this first. It checks your software, the workspace, and every deck:

```sh
aideck doctor
```

| Symptom | What to do |
| --- | --- |
| `aideck: command not found` | Use `./aideck` from your project folder, or run `./aideck link` and follow its `PATH` instructions. |
| `No AI Deck Kit workspace found here` | You are outside a deck project. `cd` into the folder you installed into. |
| Install stops on missing software | Install what section 1 lists, then run the installer again. |
| Install fails while downloading | Usually internet, a company proxy, or a VPN. Reconnect and run it again. |
| PDF export fails | Install Google Chrome, or use `aideck export html` instead. |
| The agent does not know about decks | Run `aideck skills wire` and point it at your `.claude` or `.agents` folder. |

Full command list:

```sh
aideck --help
```

---

## For maintainers

This repository is the development home of the engine itself. Decks and templates
are authored in *other* projects that install the kit.

- [docs/project-overview-pdr.md](docs/project-overview-pdr.md) — product definition
- [docs/system-architecture.md](docs/system-architecture.md) — module map
- [docs/deck-format-spec.md](docs/deck-format-spec.md) — the `.deck` bundle format
- [docs/deployment-guide.md](docs/deployment-guide.md) — install, upgrade, CI/CD

```sh
npm run lint && npm run typecheck && npm run validate
npm run test:serve && npm run test:smoke
```
