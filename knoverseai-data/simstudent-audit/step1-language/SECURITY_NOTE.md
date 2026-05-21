# Security note — OpenRouter key

## What was done
- Removed hardcoded `OPENROUTER_API_KEY` from `C:\Users\rcleg\neutral-zone-game\run_kira_free.py` (line 5). Replaced with `os.environ.get()` lookup that exits if unset.
- Copied the existing key to local `.env` (gitignored here in `simstudent-audit/`) for this audit's runs.

## What Robert MUST do (I cannot do this for you)
1. **Rotate the key on OpenRouter** — https://openrouter.ai/settings/keys — revoke the old key and generate a new one. The previous key was committed to a public-or-near-public repo and should be treated as compromised.
2. Update `simstudent-audit/.env` and any other local env stores with the new key.
3. Consider scrubbing the old key from `neutral-zone-game` git history (`git filter-repo` or BFG). The current main commit still contains the old key in the file blob history.

Until step 1 is done, anyone who saw the repo can spend on the OpenRouter account.

## Compromised key (for your reference when revoking)
Full key in `simstudent-audit/.env` (gitignored). Key prefix: `sk-or-v1-bad27f32...`

Look in the OpenRouter dashboard (https://openrouter.ai/settings/keys) for a key whose first eight characters after `sk-or-v1-` are `bad27f32` and revoke it.
