# Another Checkov GitHub Action

[![Example](https://github.com/imjasonh/another-checkov-action/actions/workflows/use-action.yml/badge.svg)](https://github.com/imjasonh/another-checkov-action/actions/workflows/use-action.yml)

Run [Checkov](https://www.checkov.io/) security scans on your infrastructure code and get results as GitHub workflow summaries with inline annotations.

## Usage

```yaml
- uses: imjasonh/another-checkov-action@...
  with:
    # These are the defaults, you can run this without any flags.
    checkov-flags: ''         # Flags to pass to checkov (e.g., '--directory . --framework terraform')
    fail-on-error: 'true'     # Fail workflow on security issues (default: 'true')
    checkov-version: 'latest' # Checkov version to install (default: 'latest')
```

By default, Checkov scans the current directory for all supported frameworks. Use `checkov-flags` to customize the scan (e.g., `--directory examples`, `--framework terraform`, `--skip-check CKV_AWS_1`, etc.).

## Features

- 📊 **Markdown summary reports** - Clear breakdown of findings by check type
- 🔗 **Linked check IDs** - Click check IDs to view Checkov guidelines
- 📍 **File annotations** - Issues appear as warnings/errors on changed files
- ⚙️ **Config file support** - Use `.checkov.yaml` to customize scans
- 🎯 **Multi-framework** - Scans Terraform, Kubernetes, and Dockerfiles

## Examples

See the [examples/](examples/) directory for intentionally misconfigured files that demonstrate what Checkov can detect.

## Configuration

### Using checkov-flags

Pass any Checkov CLI flags via the `checkov-flags` input:

```yaml
- uses: imjasonh/another-checkov-action@...
  with:
    checkov-flags: |
      --framework terraform
      --skip-check CKV_AWS_126 --compact
```

### Using a config file

Create a `.checkov.yaml` in your repository root:

```yaml
skip-check:
  - CKV_AWS_126
```

Then reference it:

```yaml
- uses: imjasonh/another-checkov-action@...
  with:
    checkov-flags: |
      --config-file .checkov.yaml
```

See [Checkov documentation](https://www.checkov.io/2.Basics/CLI-Command-Reference.html) for all available flags.

## Limitations

- **Annotation limit**: GitHub Actions limits each workflow run to 10 inline annotations. If your scan finds more than 10 issues, only the first 10 will appear as inline annotations on your PR. All findings are still visible in the workflow summary report.
