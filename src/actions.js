let corePromise;
let githubPromise;

async function getCore() {
  corePromise ??= import('@actions/core');
  return corePromise;
}

async function getGithub() {
  githubPromise ??= import('@actions/github');
  return githubPromise;
}

module.exports = { getCore, getGithub };
