const core = require('@actions/core');

/**
 * Generate GitHub Actions summary from Checkov results
 * @param {Object} results - Parsed Checkov results
 * @param {Object} context - GitHub context (optional, for file links)
 */
async function generateSummary(results, context = null) {
  const { summary, results: allResults } = results;

  // Build base URL for file links
  let fileUrlBase = null;
  if (context && context.payload.repository) {
    const { owner, repo } = context.repo;
    const sha = context.sha;
    fileUrlBase = `https://github.com/${owner.login || owner}/${repo}/blob/${sha}`;
  }

  let markdown = '# Checkov Security Scan Results\n\n';

  // Overall summary
  markdown += '## Summary\n\n';
  markdown += '| Status | Count |\n';
  markdown += '|--------|-------|\n';
  markdown += `| ✅ Passed | ${summary.passed} |\n`;
  markdown += `| ❌ Failed | ${summary.failed} |\n`;
  markdown += `| ⏭️ Skipped | ${summary.skipped} |\n`;
  markdown += `| 📊 Total Resources | ${summary.resourceCount} |\n`;

  if (summary.parsingErrors > 0) {
    markdown += `| ⚠️ Parsing Errors | ${summary.parsingErrors} |\n`;
  }

  markdown += '\n';

  // Failed checks details
  const failedChecks = allResults.filter(r => r.checkType === 'failed');
  if (failedChecks.length > 0) {
    markdown += '## Failed Checks\n\n';

    // Group by check ID and count occurrences, sorted by most common first
    const groupedByCheckId = groupBy(failedChecks, 'checkId');
    const checkCounts = Object.entries(groupedByCheckId)
      .map(([checkId, checks]) => ({
        checkId,
        checkName: checks[0].checkName,
        count: checks.length,
        checks
      }))
      .sort((a, b) => b.count - a.count);

    // Show details for each check type (most common first)
    for (const { checkId, checkName, checks } of checkCounts) {
      const checkIdDisplay = checks[0].guideline
        ? `[${checkId}](${checks[0].guideline})`
        : checkId;

      markdown += `### ${checkName} (${checkIdDisplay})\n\n`;

      for (const check of checks.slice(0, 10)) { // Limit to 10 per check type
        let fileLink;
        if (check.file) {
          const lineInfo = check.line.length > 0
            ? `:${check.line[0]}-${check.line[1]}`
            : '';

          if (fileUrlBase && check.line.length > 0) {
            // Create GitHub URL with line numbers
            const lineFragment = check.line.length > 1
              ? `#L${check.line[0]}-L${check.line[1]}`
              : `#L${check.line[0]}`;
            const url = `${fileUrlBase}/${check.file}${lineFragment}`;
            fileLink = `[\`${check.file}${lineInfo}\`](${url})`;
          } else {
            fileLink = `\`${check.file}${lineInfo}\``;
          }
        } else {
          fileLink = 'Unknown file';
        }

        markdown += `- ${fileLink}`;
        if (check.resource) {
          markdown += ` - \`${check.resource}\``;
        }
        markdown += '\n';
      }

      if (checks.length > 10) {
        markdown += `\n_... and ${checks.length - 10} more instances_\n`;
      }
      markdown += '\n';
    }
  }

  // Write to GitHub Actions summary
  await core.summary
    .addRaw(markdown)
    .write();
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key] || 'UNKNOWN';
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

module.exports = { generateSummary };
