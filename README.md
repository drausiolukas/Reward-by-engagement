# Reward by Engagement

Web app that classifies beauty products with a Teachable Machine image model and rewards user engagement with a points alert.

## What it does

- Loads a Teachable Machine image model from `my_model/`
- Classifies products from:
  - Live webcam stream
  - Uploaded image file
- Shows confidence score for each class
- Displays the detected product name, image, and description
- Triggers a reward alert when confidence passes a threshold

## Tech stack

- HTML (`index.html`)
- CSS (`style.css`)
- JavaScript (`app.js`)
- TensorFlow.js (CDN)
- Teachable Machine Image library (CDN)

## Project structure

```text
.
|-- index.html
|-- style.css
|-- app.js
|-- my_model/
|   |-- model.json
|   |-- metadata.json
|   `-- weights.bin
|-- escova/
|-- Paio/
`-- leavin/
```

## Run locally

Because webcam access usually requires a secure context, run with a local server instead of opening `index.html` directly.

### Option 1: Python

```bash
python -m http.server 5500
```

Open: `http://localhost:5500`

### Option 2: Node (serve)

```bash
npx serve .
```

Open the URL shown in the terminal.

## How to use

1. Open the app in your browser.
2. Click `Camera` to start real-time detection.
3. Or click `Upload` and choose an image.
4. Review predictions and the detected product card.

## Model and class mapping

The app expects model files in `my_model/`.

In `app.js`, `PRODUCT_INFO` maps class names (from Teachable Machine metadata) to UI data:

- `image`
- `name`
- `description`

Important: class names in `PRODUCT_INFO` must exactly match model class labels.

## Reward logic

In `app.js`, the alert logic is confidence-based:

- Uploaded photo threshold: `0.90`
- Webcam threshold: `0.99`
- Cooldown between alerts: `10` seconds

You can adjust these values inside the `predict()` function.

## Troubleshooting

- Camera not opening:
  - Confirm you are using `http://localhost` (or HTTPS).
  - Allow camera permission in the browser.
- Wrong product names or missing product details:
  - Verify `PRODUCT_INFO` keys match model labels exactly.
- Product image not showing:
  - Check the image path configured in `PRODUCT_INFO`.

## Notes

- The file `project.tm` appears to be a Teachable Machine project artifact.
- You can replace the model by updating files inside `my_model/` and adjusting `PRODUCT_INFO`.
