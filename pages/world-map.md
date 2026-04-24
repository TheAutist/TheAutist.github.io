# World Map

Below is an interactive map. Zoom and pan to explore.

{{map:world.json}}

## How Maps Work

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
