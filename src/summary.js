const core = require('@actions/core');

/**
 * Generate GitHub Actions summary from Checkov results
 * @param {Object} results - Parsed Checkov results
 */
async function generateSummary(results) {
  const { summary, results: allResults } = results;

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
    markdown += '## Failed Checks by Type\n\n';

    // Group by check ID and count occurrences
    const groupedByCheckId = groupBy(failedChecks, 'checkId');
    const checkCounts = Object.entries(groupedByCheckId)
      .map(([checkId, checks]) => ({
        checkId,
        checkName: checks[0].checkName,
        count: checks.length,
        checks
      }))
      .sort((a, b) => b.count - a.count);

    // Show summary table
    markdown += '| Check | Count |\n';
    markdown += '|-------|-------|\n';
    for (const { checkId, checkName, count } of checkCounts) {
      markdown += `| ${checkName} (${checkId}) | ${count} |\n`;
    }
    markdown += '\n';

    // Show details for each check type
    markdown += '## Failed Check Details\n\n';
    for (const { checkId, checkName, checks } of checkCounts) {
      markdown += `### ${checkName} (${checkId})\n\n`;

      if (checks[0].guideline) {
        markdown += `[View Guideline](${checks[0].guideline})\n\n`;
      }

      for (const check of checks.slice(0, 10)) { // Limit to 10 per check type
        const lineInfo = check.line.length > 0
          ? `:${check.line[0]}-${check.line[1]}`
          : '';
        const fileLink = check.file ? `[\`${check.file}${lineInfo}\`](${check.file})` : 'Unknown file';

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
