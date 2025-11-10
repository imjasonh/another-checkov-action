const core = require('@actions/core');
const exec = require('@actions/exec');

/**
 * Add annotations for failed checks on PR diff lines
 * @param {Object} results - Parsed Checkov results
 * @param {Object} context - GitHub context
 */
async function addAnnotations(results, context) {
  core.info('Starting annotation process...');

  try {
    const failedChecks = results.results.filter(r => r.checkType === 'failed');

    core.info(`Found ${failedChecks.length} failed checks`);

    if (failedChecks.length === 0) {
      core.info('No failed checks to annotate');
      return;
    }

    // Get changed files in the PR
    const changedFiles = await getChangedFiles(context);

    core.info(`Found ${changedFiles.size} changed files`);

    // Log unique file paths from checks for debugging
    const checkFiles = new Set(failedChecks.map(c => c.file).filter(f => f));
    core.info(`Files with issues: ${Array.from(checkFiles).join(', ')}`);

    // Add annotations for checks that affect changed files
    // Note: GitHub Actions limits us to 10 annotations per workflow run
    let annotationCount = 0;
    const maxAnnotations = 10;

    for (const check of failedChecks) {
      if (annotationCount >= maxAnnotations) {
        core.warning(`Reached GitHub Actions annotation limit (${maxAnnotations}). Remaining ${failedChecks.length - annotationCount} issues are visible in the summary.`);
        break;
      }
      if (!check.file) {
        continue;
      }

      // Try multiple path variations to match against changed files
      const pathVariations = [
        check.file,
        check.file.startsWith('/') ? check.file.slice(1) : check.file,
        check.file.startsWith('./') ? check.file.slice(2) : check.file,
        check.file.replace(/^\//, ''),
        check.file.replace(/^\.\//, '')
      ];

      let matchedPath = null;
      for (const path of pathVariations) {
        if (changedFiles.has(path)) {
          matchedPath = path;
          break;
        }
      }

      // Check if this file was changed in the PR
      if (matchedPath) {
        const properties = {
          title: `${check.checkId}: ${check.checkName}`,
          file: matchedPath,
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
      } else {
        core.warning(`No match for file: ${check.file} (tried variations but none matched changed files)`);
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
      core.info('Not a pull request, skipping file change detection');
      return changedFiles;
    }

    // Use git diff against the base branch instead of SHAs
    const baseBranch = context.payload.pull_request.base.ref;
    core.info(`Detecting changed files against base branch: ${baseBranch}`);

    let output = '';
    let exitCode = 0;

    try {
      exitCode = await exec.exec('git', ['diff', '--name-only', `origin/${baseBranch}...HEAD`], {
        ignoreReturnCode: true,
        listeners: {
          stdout: (data) => {
            output += data.toString();
          },
          stderr: (data) => {
            core.debug(`git diff stderr: ${data.toString()}`);
          }
        }
      });
    } catch (err) {
      core.warning(`git diff command failed: ${err.message}`);
      return changedFiles;
    }

    if (exitCode !== 0) {
      core.warning(`git diff exited with code ${exitCode}, trying alternative method`);
      // Fallback: just annotate everything
      return changedFiles;
    }

    const files = output.split('\n').filter(f => f.trim());
    for (const file of files) {
      changedFiles.add(file);
    }

    if (changedFiles.size > 0) {
      core.info(`Changed files: ${Array.from(changedFiles).slice(0, 10).join(', ')}${changedFiles.size > 10 ? ` ... and ${changedFiles.size - 10} more` : ''}`);
    } else {
      core.warning('No changed files detected - annotations may not appear');
    }
  } catch (error) {
    core.warning(`Failed to get changed files: ${error.message}`);
  }

  return changedFiles;
}

module.exports = { addAnnotations };
