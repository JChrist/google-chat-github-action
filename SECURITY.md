# Security Policy

## Supported Versions

This project is distributed as a GitHub Action and is versioned through Git tags.

| Version | Supported |
| ------- | --------- |
| `v1` | Yes |
| Earlier versions or untagged revisions | No |

Security fixes are released for the currently supported major version. Users should pin workflows to a supported tag, or to a full commit SHA when their environment requires strict supply-chain control.

## Reporting a Vulnerability

Please do not report security vulnerabilities in public GitHub issues, pull requests, discussions, or comments.

Report vulnerabilities privately through GitHub's private vulnerability reporting or by opening a draft security advisory for this repository:

<https://github.com/jchrist/google-chat-github-action/security/advisories/new>

If private vulnerability reporting is unavailable, open a minimal public issue that asks for a secure contact method without including technical details, exploit steps, secrets, webhook URLs, logs, or screenshots that reveal sensitive data.

## What to Include

Include enough information to reproduce and assess the issue safely:

- Affected version, tag, or commit SHA
- A clear description of the vulnerability and potential impact
- Reproduction steps or a minimal workflow example
- Whether the issue can expose, leak, alter, or misuse GitHub tokens, workflow secrets, Google Chat webhook URLs, repository data, or workflow output
- Any relevant logs with secrets and webhook URLs removed

## Response Expectations

After a report is received, maintainers will make a best effort to:

- Acknowledge the report within 7 days
- Triage the report and request clarification when needed
- Coordinate a fix and release timing privately before public disclosure
- Publish an advisory or release notes when disclosure is appropriate

This is an open source project maintained on a best-effort basis. Response and fix timelines may vary based on severity, exploitability, and maintainer availability.

## Security Scope

Security issues for this project include, but are not limited to:

- Exposure of GitHub Actions secrets or Google Chat webhook URLs
- Unsafe handling of workflow context, repository metadata, or user-controlled input
- Injection vulnerabilities in generated Google Chat card content
- Dependency vulnerabilities that are exploitable through this action
- Behavior that allows unauthorized message delivery, data exfiltration, or privilege escalation in a workflow

General bugs, feature requests, documentation improvements, and non-security dependency updates should be reported through normal GitHub issues or pull requests.

## Safe Usage Guidance

- Store Google Chat webhook URLs in GitHub Actions secrets, not in workflow files.
- Avoid printing webhook URLs, tokens, or other secrets in workflow logs.
- Restrict repository and workflow permissions to the minimum required by your workflows.
- Prefer pinning this action to a stable tag or commit SHA instead of an untrusted branch reference.
- Review third-party workflow changes before running them with access to secrets.

## Disclosure Policy

Please allow maintainers time to investigate and remediate confirmed vulnerabilities before public disclosure. Do not publish exploit details, proof-of-concept code, or sensitive information until a fix or mitigation has been released and disclosure has been coordinated.
