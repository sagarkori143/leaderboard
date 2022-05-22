import fs from "fs";
import { join } from "path";
import matter from "gray-matter";
import githubData from "/data/github_test.json";

const root = join(process.cwd(), "contributors");
const slackRoot = join(process.cwd(), "data/slack");

export function formatSlug(slug) {
  return slug.replace(/\.md$/, "");
}

export function getSlackMessages(slackId) {
  const filePath = join(slackRoot, `${slackId}.json`);
  let fileContents = [];
  try {
    fileContents = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    console.log(e);
  }
  return Object.values(fileContents).reduce((acc, messages) => {
    return acc.concat(
      messages.map((message) => ({
        type: "eod_update",
        time: new Date(message.ts * 1000).toISOString(),
        link: "",
        text: message.text,
      }))
    );
  }, []);
}

export function getContributorsSlugs() {
  const contributorSlugs = [];
  fs.readdirSync(`${root}`).forEach((file) => {
    contributorSlugs.push({ file: file });
  });

  return contributorSlugs;
}

export function getContributorBySlug(file) {
  const fullPath = join(root, `${formatSlug(file)}.md`);
  const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));

  let activityData = githubData[file] ?? { activity: [] };
  activityData = {
    ...activityData,
    activity: [...activityData.activity, ...getSlackMessages(data.slack)],
  };

  return {
    file: file,
    slug: formatSlug(file),
    path: fullPath,
    content: content,
    activityData: activityData,
    ...data,
  };
}

export function getContributors() {
  const contributors = getContributorsSlugs()
    .map((path) => getContributorBySlug(path.file))
    .sort((x, y) => (x.joining_date > y.joining_date ? 1 : -1));
  return contributors;
}