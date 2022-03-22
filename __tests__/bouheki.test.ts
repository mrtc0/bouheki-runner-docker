import {
  BouhekiConfigBuilder,
  DefaultAllowedDomains,
  BouhekiConfigInterface,
} from "../src/bouheki";
import { loadYamlFile } from "./helper";

test("BouhekiConfig initialize", () => {
  const config = new BouhekiConfigBuilder();
  expect(config.bouhekiConfig.network.domain.allow).toEqual(
    DefaultAllowedDomains
  );
});

test("allowedAddresses", () => {
  const builder = new BouhekiConfigBuilder().allowedAddresses(
    "127.0.0.1/32,10.0.1.0/24,example.com"
  );
  const expectDomains = DefaultAllowedDomains.concat("example.com");
  expect(builder.bouhekiConfig.network.domain.allow).toEqual(expectDomains);
  expect(builder.bouhekiConfig.network.cidr.allow).toEqual([
    "127.0.0.1/32",
    "10.0.1.0/24",
  ]);
});

test("writeConfig", () => {
  const builder = new BouhekiConfigBuilder().allowedAddresses(
    "127.0.0.1/32,10.0.1.0/24,example.com"
  );
  builder.writeConfig("_bouheki_test.yml");
  const config: BouhekiConfigInterface = loadYamlFile("_bouheki_test.yml");
  const expectDomains = DefaultAllowedDomains.concat("example.com");
  expect(config.network.domain.allow).toEqual(expectDomains);
  expect(config.network.cidr.allow).toEqual(["127.0.0.1/32", "10.0.1.0/24"]);
});
