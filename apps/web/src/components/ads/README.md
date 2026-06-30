# Ad runtime

## Third-party ownership

The runtime treats provider markup as opaque content. It does not inspect video
DOM, rewrite provider classes, change stacking order, or attach listeners to
player controls. Sticky behavior, controls, Close actions, dimensions, and
z-index remain fully owned by the provider.

External script URLs are loaded once per browser session. Inline initialization
code still runs for each placement.

## Unknown third-party snippets

Unknown code must be explicitly isolated instead of guessed from arbitrary HTML:

```html
<div data-ad-runtime="iframe">
  <!-- complete provider snippet, including its scripts and container -->
</div>
```

The friendly iframe uses `srcdoc`, a unique instance ID, and a sandbox without
`allow-same-origin`. Scripts required by that player must be included inside
the marked snippet; a script loaded separately in the parent page is not visible
inside the iframe.

Legacy providers that expose fixed IDs or window globals remain single-player
providers in the parent document. Use a self-contained isolated snippet when
multiple independent copies of such a provider are required on one page.
