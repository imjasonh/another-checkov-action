const core = require('@actions/core');
const github = require('@actions/github');

/**
 * Add annotations for failed checks on PR diff lines
 * @param {Object} results - Parsed Checkov results
 * @param {Object} context - GitHub context
 */
async function addAnnotations(results, context) {
  try {
    const failedChecks = results.results.filter(r => r.checkType === 'failed');

    if (failedChecks.length === 0) {
      return;
    }

    // Get changed files in the PR
    const changedFiles = await getChangedFiles(context);

    // Add annotations for checks that affect changed files
    for (const check of failedChecks) {
      if (!check.file || check.line.length === 0) {
        continue;
      }

      // Check if this file was changed in the PR
      if (changedFiles.has(check.file)) {
        const properties = {
          title: `${check.checkId}: ${check.checkName}`,
          file: check.file,
          startLine: check.line[0] || 1,
          endLine: check.line[1] || check.line[0] || 1
        };

        let message = `**${check.checkName}**\n\n`;
        message += `Severity: ${check.severity}\n`;
        if (check.resource) {
          message += `Resource: ${check.resource}\n`;
        }
        if (check.guideline) {
          message += `\n[View Guideline](${check.guideline})`;
        }

        // Use warning for LOW/MEDIUM, error for HIGH/CRITICAL
        if (check.severity === 'CRITICAL' || check.severity === 'HIGH') {
          core.error(message, properties);
        } else {
          core.warning(message, properties);
        }
      }
    }
  } catch (error) {
    core.warning(`Failed to add annotations: ${error.message}`);
  }
}

/**
 * Get the set of files changed in the current PR
 * @param {Object} context - GitHub context
 * @returns {Set<string>} Set of changed file paths
 */
async function getChangedFiles(context) {
  const changedFiles = new Set();

  try {
    if (!context.payload.pull_request) {
      return changedFiles;
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      core.warning('GITHUB_TOKEN not available, skipping PR diff analysis');
      return changedFiles;
    }

    const octokit = github.getOctokit(token);
    const { owner, repo } = context.repo;
    const prNumber = context.payload.pull_request.number;

    // Get PR files
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber
    });

    for (const file of files) {
      changedFiles.add(file.filename);
    }
  } catch (error) {
    core.warning(`Failed to get changed files: ${error.message}`);
  }

  return changedFiles;
}

module.exports = { addAnnotations };
