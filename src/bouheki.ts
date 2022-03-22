import ip6addr from "ip6addr";
import yaml from "js-yaml";
import * as fs from "fs";

export interface BouhekiConfigInterface {
  network: {
    mode: string;
    target: string;
    cidr: {
      allow: Array<string>;
      deny: Array<string>;
    };
    domain: {
      allow: Array<string>;
      deny: Array<string>;
    };
  };
  files: { enable: boolean };
  mount: { enable: boolean };
  log: {
    format: string;
    output: string;
  };
}

export const DefaultAllowedDomains = [
  "github.com",
  "api.github.com",
  "codeload.github.com",
  "objects.github.com",
  "objects.githubusercontent.com",
  "objects-origin.githubusercontent.com",
  "github-releases.githubusercontent.com",
  "github-registry-files.githubusercontent.com",
];

export class BouhekiConfigBuilder {
  bouhekiConfig: BouhekiConfigInterface;

  constructor() {
    this.bouhekiConfig = {
      network: {
        mode: "block",
        target: "container",
        cidr: {
          allow: [],
          deny: [],
        },
        domain: {
          allow: DefaultAllowedDomains,
          deny: [],
        },
      },
      files: { enable: false },
      mount: { enable: false },
      log: {
        format: "json",
        output: "/var/log/bouheki.log.json",
      },
    };
  }

  public allowedAddresses(addresses: string): BouhekiConfigBuilder {
    addresses.split(",").map((addr) => {
      try {
        const cidr: string = ip6addr.createCIDR(addr).toString();
        this.bouhekiConfig.network.cidr.allow.push(cidr);
      } catch {
        this.bouhekiConfig.network.domain.allow =
          this.bouhekiConfig.network.domain.allow.concat(addr);
      }
    });

    return this;
  }

  public writeConfig(path: string) {
    fs.writeFileSync(path, yaml.dump(this.bouhekiConfig));
  }
}
