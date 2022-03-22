import yaml from "js-yaml";
import * as fs from "fs";

export const loadYamlFile = (filename) => {
  const yamlText = fs.readFileSync(filename, "utf8");
  return yaml.load(yamlText);
};
