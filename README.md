# Google Chat GitHub Action
Send a notification to Google Chat with the result of a GitHub Action.

## Usage
| Name| Required| Description                                                                                                                              |
|:----|:----|------------------------------------------------------------------------------------------------------------------------------------------|
| `name`| true| Job name. Used in the card title                                                                                                         |
| `url`| true| Google Chat Webhook URL                                                                                                                  |
| `status`| true| Job status. It may be one of `success`, `failure`, `cancelled`. It's really meant to be used with `${{ job.status }}` |

## Example
```yaml
- name: Google Chat Notification
  uses: jchrist/google-chat-github-action@v1
  with:
    name: Build
    url: ${{ secrets.GOOGLE_CHAT_WEBHOOK }}
    status: ${{ job.status }}
  if: always()
  # this allows the build to succeed even when the notification fails
  # e.g. due to dependabot push, which may not have the secret
  continue-on-error: true
```