# Spinneys Hot Food - GitHub Pages

Static HTML/CSS/JavaScript website for the Spinneys Hot Food product list.

## Images

The image logic works in this order:

1. `images/<No_>.jpg` if you provide a real product image.
2. A category fallback image from Unsplash/Pexels if the local image is missing.
3. For visible/missing products, the site searches Wikimedia Commons in the browser for a more relevant food image.
4. If the online search fails, the category fallback remains visible.

Online image results are cached in the visitor's browser with `localStorage`, so the site does not repeatedly search for the same product.

**Important:** online images are third-party content. Before using the site for business/public use, verify that each selected image is permitted for your intended use and keep the source credit shown on the image.

## GitHub Pages

Upload the contents of this folder to the root of your GitHub repository, keeping `index.html` at the repository root.

Then go to:

`Settings -> Pages -> Build and deployment -> Deploy from a branch -> main -> /(root)`

GitHub Pages will publish the static site.

## Product data

Replace `data/products.json` with your complete JSON file. The application accepts either a JSON array or your current `{ "Spinneys": [...] }` structure.

## Local images

For exact Spinneys product photos, add files such as:

`images/123002.jpg`

The local image will always be preferred over internet images.
