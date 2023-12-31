const github = require('@actions/github');
const axios = require('axios');
const core = require('@actions/core');

const colors = {
  success: '#2cbe4e',
  failure: '#ff0000',
  other: '#ffc107'
};

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const name = core.getInput('name', { required: true });
    const url = core.getInput('url', { required: true });
    const status = core.getInput('status', { required: true });

    core.debug(`input params: name=${name}, status=${status}, url=${url}`);

    const ok = await sendNotification(name, url, status);
    if (!ok) {
      core.setFailed('error sending notification to google chat');
    } else {
      core.debug(`Sent notification: ${name}, ${status}`);
    }
  } catch (e) {
    core.setFailed(`error sending notification to google chat: ${e}`);
  }
}

async function sendNotification(name, url, status) {
  const { owner, repo } = github.context.repo;
  const { eventName, sha, ref } = github.context;
  const { number } = github.context.issue;
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const eventPath = eventName === 'pull_request' ? `/pull/${number}` : `/commit/${sha}`;
  const eventUrl = `${repoUrl}${eventPath}`;
  const checksUrl = `${repoUrl}${eventPath}/checks`;

  const statusLower = status.toLowerCase();
  let statusColor;
  if (statusLower === 'success') {
    statusColor = colors.success;
  } else if (statusLower === 'failure') {
    statusColor = colors.failure;
  } else {
    // if (statusLower === 'cancelled') {
    statusColor = colors.other;
  }

  const card = createCard({ name, status, statusColor, owner, repo, eventName, ref, checksUrl, repoUrl, eventUrl });
  const body = createBody(name, card);

  try {
    const response = await axios.post(url, body);
    core.debug(`request success with status: ${response.status}`);
    return true;
  } catch (e) {
    core.debug(`request failed with error, body: ${JSON.stringify(body)}, response:${JSON.stringify(e.response?.data || '')}`);
    return false;
  }
}

function createCard({ name, status, statusColor, owner, repo, eventName, ref, checksUrl, repoUrl, eventUrl }) {
  return {
    header: {
      title: `<b>${name}</b>`,
      subtitle: `<font color="${statusColor}">${status}</font>`
      // imageUrl: 'https://developers.google.com/chat/images/quickstart-app-avatar.png',
      // imageType: 'CIRCLE'
    },
    sections: [
      {
        widgets: [
          {
            columns: {
              columnItems: [
                {
                  horizontalSizeStyle: 'FILL_AVAILABLE_SPACE',
                  horizontalAlignment: 'START',
                  verticalAlignment: 'TOP',
                  widgets: [
                    { textParagraph: { text: `<b>Status: <font color="${statusColor}">${status}</font></b>` } },
                    { textParagraph: { text: `<b>Repository</b>: ${owner}/${repo}` } },
                    { textParagraph: { text: `<b>Event</b>: ${eventName}` } },
                    { textParagraph: { text: `<b>Ref</b>: ${ref}` } }
                  ]
                },
                {
                  horizontalSizeStyle: 'FILL_AVAILABLE_SPACE',
                  horizontalAlignment: 'START',
                  verticalAlignment: 'TOP',
                  widgets: [
                    { buttonList: { buttons: [{ text: 'Open Checks', onClick: { openLink: { url: checksUrl } }, disabled: false }] } },
                    { buttonList: { buttons: [{ text: 'Open Repository', onClick: { openLink: { url: repoUrl } }, disabled: false }] } },
                    { buttonList: { buttons: [{ text: 'Open Event', onClick: { openLink: { url: eventUrl } }, disabled: false }] } }
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  };
}

function createBody(name, card) {
  return { text: '', cardsV2: [{ cardId: name, card: { name, ...card } }] };
}

// exports
module.exports = { run, colors };
