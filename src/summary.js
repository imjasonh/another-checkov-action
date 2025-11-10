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

  // Breakdown by severity
  if (Object.keys(summary.byCheckType).length > 0) {
    markdown += '## Findings by Severity\n\n';
    markdown += '| Severity | Passed | Failed | Skipped |\n';
    markdown += '|----------|--------|--------|----------|\n';

    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];
    for (const severity of severities) {
      if (summary.byCheckType[severity]) {
        const { passed, failed, skipped } = summary.byCheckType[severity];
        const icon = getSeverityIcon(severity);
        markdown += `| ${icon} ${severity} | ${passed} | ${failed} | ${skipped} |\n`;
      }
    }
    markdown += '\n';
  }

  // Failed checks details
  const failedChecks = allResults.filter(r => r.checkType === 'failed');
  if (failedChecks.length > 0) {
    markdown += '## Failed Checks\n\n';

    // Group by severity
    const groupedBySeverity = groupBy(failedChecks, 'severity');

    for (const [severity, checks] of Object.entries(groupedBySeverity)) {
      const icon = getSeverityIcon(severity);
      markdown += `### ${icon} ${severity} Severity\n\n`;

      for (const check of checks.slice(0, 50)) { // Limit to avoid huge summaries
        const lineInfo = check.line.length > 0
          ? `:${check.line[0]}-${check.line[1]}`
          : '';
        const fileLink = check.file ? `[\`${check.file}${lineInfo}\`](${check.file})` : 'Unknown file';

        markdown += `- **${check.checkName}** (${check.checkId})\n`;
        markdown += `  - File: ${fileLink}\n`;
        if (check.resource) {
          markdown += `  - Resource: \`${check.resource}\`\n`;
        }
        if (check.guideline) {
          markdown += `  - [View Guideline](${check.guideline})\n`;
        }
        markdown += '\n';
      }

      if (checks.length > 50) {
        markdown += `\n_... and ${checks.length - 50} more ${severity} severity issues_\n\n`;
      }
    }
  }

  // Write to GitHub Actions summary
  await core.summary
    .addRaw(markdown)
    .write();
}

function getSeverityIcon(severity) {
  const icons = {
    'CRITICAL': '🔴',
    'HIGH': '🟠',
    'MEDIUM': '🟡',
    'LOW': '🔵',
    'UNKNOWN': '⚪'
  };
  return icons[severity] || '⚪';
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
