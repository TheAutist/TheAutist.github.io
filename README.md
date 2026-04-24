# Welcome to the World Wiki

This is your fantasy world encyclopedia. Use the sidebar to navigate between pages, or use **wiki-links** to connect articles together.

## Getting Started

- Add new pages as `.md` files in the `pages/` directory
- Register them in `pages/index.json` so they appear in the sidebar
- Link between pages using `[[Page Name]]` syntax

## Features

- **Wiki-links** — link pages with `[[Page Name]]` or `[[Page Name|display text]]`
- **Interactive maps** — embed maps with `{{map:filename.json}}`
- **Infoboxes** — add sidebar info panels to any page
- **Search** — filter the sidebar with the search box
- **Markdown** — headings, bold, italic, lists, tables, blockquotes, code blocks, images

## Example Syntax

```
# Heading
**bold** and *italic*
[[Another Page]] or [[another-page|Custom Label]]
![Alt text](images/photo.jpg)
{{map:world.json}}
```

See the [[World Map]] page for a map embed example, or [[Factions]] for an infobox example.

# How Maps Work

1. Place your map image in the `maps/` directory (e.g. `maps/world.png`)
2. Create a JSON config in `maps/` (e.g. `maps/world.json`) describing the image and markers
3. Embed it in any page with `{{map:world.json}}`

### Map JSON Format

```
{
  "image": "maps/world.png",
  "bounds": [[0, 0], [1000, 1000]],
  "minZoom": -2,
  "maxZoom": 2,
  "markers": [
    {
      "name": "Capital City",
      "coords": [500, 500],
      "description": "The seat of power.",
      "page": "Capital City"
    }
  ]
}
```

- **image** — path to your map image
- **bounds** — coordinate space (match your image's pixel dimensions)
- **markers** — clickable pins with names, descriptions, and links to wiki pages
