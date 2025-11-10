/**
 * Parse Checkov JSON results
 * @param {string} rawResults - Raw JSON string from Checkov
 * @returns {Object} Parsed results with summary and details
 */
function parseCheckovResults(rawResults) {
  const data = JSON.parse(rawResults);

  const summary = {
    passed: 0,
    failed: 0,
    skipped: 0,
    parsingErrors: 0,
    resourceCount: 0,
    byCheckType: {}
  };

  const allResults = [];

  // Checkov outputs an array of results, one per framework
  const resultsArray = Array.isArray(data) ? data : [data];

  for (const frameworkResult of resultsArray) {
    // Aggregate summary data
    if (frameworkResult.summary) {
      summary.passed += frameworkResult.summary.passed || 0;
      summary.failed += frameworkResult.summary.failed || 0;
      summary.skipped += frameworkResult.summary.skipped || 0;
      summary.parsingErrors += frameworkResult.summary.parsing_errors || 0;
      summary.resourceCount += frameworkResult.summary.resource_count || 0;
    }

    // Process results by check type
    const checkTypes = ['passed_checks', 'failed_checks', 'skipped_checks'];

    for (const checkType of checkTypes) {
      if (frameworkResult.results && frameworkResult.results[checkType]) {
        const checks = frameworkResult.results[checkType];

        for (const check of checks) {
          const result = {
            checkId: check.check_id,
            checkName: check.check_name || check.check_id,
            checkType: checkType.replace('_checks', ''),
            file: check.file_path || check.repo_file_path,
            resource: check.resource,
            line: check.file_line_range || [],
            guideline: check.guideline,
            severity: check.severity || 'UNKNOWN'
          };

          allResults.push(result);

          // Count by type
          const severity = result.severity;
          if (!summary.byCheckType[severity]) {
            summary.byCheckType[severity] = { passed: 0, failed: 0, skipped: 0 };
          }
          summary.byCheckType[severity][result.checkType]++;
        }
      }
    }
  }

  return {
    summary,
    results: allResults,
    raw: data
  };
}

module.exports = { parseCheckovResults };
