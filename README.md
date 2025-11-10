# Checkov GitHub Action

Run [Checkov](https://www.checkov.io/) security scans on your infrastructure code and get results as GitHub workflow summaries with inline annotations.

## Usage

```yaml
- uses: imjasonh/another-checkov-action@...
  with:
    directory: '.'          # Directory to scan (default: '.')
    framework: 'all'        # Framework to scan: terraform, kubernetes, dockerfile, or all (default: 'all')
    fail-on-error: 'true'   # Fail workflow on security issues (default: 'true')
    config-file: ''         # Path to .checkov.yaml config (auto-detected if exists)
```

## Example Workflow

```yaml
name: Security Scan

on:
  pull_request:
    paths:
      - '**.tf'
      - '**.yaml'
      - '**/Dockerfile'

permissions:
  contents: read

jobs:
  checkov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: imjasonh/another-checkov-action@...
```

## Features

- 📊 **Markdown summary reports** - Clear breakdown of findings by check type
- 🔗 **Linked check IDs** - Click check IDs to view Checkov guidelines
- 📍 **File annotations** - Issues appear as warnings/errors on changed files
- ⚙️ **Config file support** - Use `.checkov.yaml` to customize scans
- 🎯 **Multi-framework** - Scans Terraform, Kubernetes, and Dockerfiles

## Examples

See the [examples/](examples/) directory for intentionally misconfigured files that demonstrate what Checkov can detect.

## Configuration

Create a `.checkov.yaml` in your repository root to customize scanning:

```yaml
skip-check:
  - CKV_AWS_126  # Skip specific checks
```

See [Checkov documentation](https://www.checkov.io/2.Basics/Suppressing%20and%20Skipping%20Policies.html) for more configuration options.
