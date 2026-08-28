# Permanent schema backward compatibility

## What changed

- Recorded backward compatibility as a permanent AI Deck Kit stability
  invariant in the active content-schema redesign plan.
- Clarified that v1 remains supported indefinitely and that any future v1-to-v2
  migration must be explicit, opt-in, and verifiable.

## Why

The user confirmed that backward compatibility is required system behavior,
not a temporary release bridge. Future engine or schema releases must not
silently reopen that decision.

## Follow-ups

- Complete the production-readiness review.
- Obtain user approval of the disposable v1/v2 compatibility renders before
  implementing documentation or migration-tool changes.
