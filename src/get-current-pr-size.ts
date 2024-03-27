import { octokit } from './octokit';
import * as github from '@actions/github';
import { getMultilineInput, info } from '@actions/core';
import { getPrSizeInputs, Size } from './pr-sizes';

export const getCurrentPrSize = async () => {
  const { data } = await octokit.rest.pulls.listFiles({
    ...github.context.repo,
    pull_number: github.context.issue.number,
    per_page: 100
  });

  const excludedPatterns = getMultilineInput('excluded_files').map(v=> v.split('\\n')).flat().map(v=> v.trim());
  info(`excludedPatterns: ${JSON.stringify(excludedPatterns, null, 2)}`);


  info(`line summary: '총 변경라인' | '이 파일에서 변경된 라인 수' | 'ignore 파일인지?' | '경로포함한 파일이름'`);
  const lines = data.reduce((acc, file) => {
    const isMatch = excludedPatterns && excludedPatterns.some((pattern) => file.filename.match(pattern));
    const sum = isMatch ? acc : acc + file.changes;
    info(`line summary: ${sum.toString(10).padStart(4, '0')} | ${(sum - acc).toString(10).padStart(4, '0')} | ${String(isMatch).padStart(5, ' ')} | ${file.filename}`);
    return sum;
  }, 0);

  info(`Lines changed: ${lines}`);

  const prSizes = getPrSizeInputs();

  return Object.values(prSizes).find(({ diff }) => lines <= diff) || prSizes[Size.XL];
};
