const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

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

    core.info(`Found ${changedFiles.size} changed files`);
    core.info(`Found ${failedChecks.length} failed checks`);

    // Add annotations for checks that affect changed files
    let annotationCount = 0;
    for (const check of failedChecks) {
      if (!check.file) {
        continue;
      }

      // Normalize file paths (remove leading slash if present)
      const normalizedCheckFile = check.file.startsWith('/') ? check.file.slice(1) : check.file;

      // Check if this file was changed in the PR
      if (changedFiles.has(normalizedCheckFile)) {
        const properties = {
          title: `${check.checkId}: ${check.checkName}`,
          file: normalizedCheckFile,
          startLine: check.line[0] || 1,
          endLine: check.line[1] || check.line[0] || 1
        };

        let message = check.checkName;
        if (check.resource) {
          message += `\nResource: ${check.resource}`;
        }
        if (check.guideline) {
          message += `\n${check.guideline}`;
        }

        // Create error annotations for all failed checks
        core.error(message, properties);
        annotationCount++;
      }
    }

    core.info(`Created ${annotationCount} annotations`);
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

    const baseSha = context.payload.pull_request.base.sha;
    const headSha = context.payload.pull_request.head.sha;

    // Use git diff to get changed files
    let output = '';

    await exec.exec('git', ['diff', '--name-only', `${baseSha}...${headSha}`], {
      listeners: {
        stdout: (data) => {
          output += data.toString();
        }
      }
    });

    const files = output.split('\n').filter(f => f.trim());
    for (const file of files) {
      changedFiles.add(file);
    }

    if (changedFiles.size > 0) {
      core.info(`Changed files: ${Array.from(changedFiles).join(', ')}`);
    }
  } catch (error) {
    core.warning(`Failed to get changed files: ${error.message}`);
  }

  return changedFiles;
}

module.exports = { addAnnotations };
