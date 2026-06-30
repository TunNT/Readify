# Ad runtime

## Video provider boundary

`video-adapters.ts` is the only place allowed to know a provider's DOM selectors
or event quirks. An adapter detects its player, maps the provider DOM to the
semantic attributes below, observes late DOM changes, and removes every listener
or observer from `disconnect()`.

- `data-video-surface`: root constrained by the floating host
- `data-video-layer="media|ad|controls"`: paint order
- `data-video-interactive`: elements that must receive pointer/touch events

To add a supported provider, implement `VideoProviderAdapter` and add it to the
registry. Do not add provider IDs/classes to `ads.module.css`.

## Runtime ownership

`AdsRuntime` owns the single active floating instance. Each placement receives
a stable instance ID and releases its observers, provider connection, and
floating ownership when the route changes or the placement unmounts.

Provider sticky geometry may be written as inline `!important`. While floating,
the runtime temporarily constrains only the adapter's semantic surface and
restores its original inline styles when it returns inline.

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
