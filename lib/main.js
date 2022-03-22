"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const path = __importStar(require("path"));
const child_process = __importStar(require("child_process"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const ip6addr_1 = __importDefault(require("ip6addr"));
const fs = __importStar(require("fs"));
const systemdUnitFilePath = "/etc/systemd/system/bouheki.service";
const DefaultAllowedDomains = [
    "github.com",
    "api.github.com",
    "codeload.github.com",
    "objects.github.com",
    "objects.githubusercontent.com",
    "objects-origin.githubusercontent.com",
    "github-releases.githubusercontent.com",
    "github-registry-files.githubusercontent.com"
];
const bouhekiPath = "/usr/local/bin/bouheki";
const bouhekiConfigPath = path.join(__dirname, "hardening-github-actions.yaml");
const systemdUnitFile = `[Unit]
Description=bouheki
After=network.target

[Service]
Type=simple
User=root
Group=root
ExecStart=${bouhekiPath} --config ${bouhekiConfigPath}
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
`;
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (process.platform !== "linux") {
            core.setFailed("This action only runs on Linux.");
            return;
        }
        if (core.getInput("service_action") === "stop") {
            child_process.execSync("sudo systemctl stop bouheki");
            return;
        }
        const config = {
            allowed_endpoints: core.getInput("allowed-endpoints"),
            mode: core.getInput("mode"),
            target: core.getInput("target"),
        };
        if (config.mode !== "block" && config.mode !== "monitor") {
            core.setFailed("mode must be either 'block' or 'monitor'");
        }
        if (config.target !== "container" && config.target !== "host") {
            core.setFailed("target must be either 'container' or 'host'");
        }
        const bouhekiConfig = {
            network: {
                mode: config.mode,
                target: config.target,
                cidr: {
                    allow: [],
                    deny: []
                },
                domain: {
                    allow: DefaultAllowedDomains,
                    deny: []
                }
            },
            files: { enable: false },
            mount: { enable: false },
            log: {
                format: "json",
                output: "/var/log/bouheki.log.json"
            }
        };
        config.allowed_endpoints.split(",").map(addr => {
            try {
                const cidr = ip6addr_1.default.createCIDR(addr).toString();
                bouhekiConfig.network.cidr.allow.push(cidr);
            }
            catch (_a) {
                bouhekiConfig.network.domain.allow.push(addr);
            }
        });
        fs.writeFileSync(bouhekiConfigPath, js_yaml_1.default.dump(bouhekiConfig));
        if (!fs.existsSync(bouhekiPath)) {
            const downloadPath = yield tc.downloadTool("https://github.com/mrtc0/bouheki/releases/download/v0.0.5/bouheki_0.0.5_Linux_x86_64.tar.gz");
            const extractPath = yield tc.extractTar(downloadPath);
            let cmd = "cp", args = [path.join(extractPath, "bouheki"), bouhekiPath];
            child_process.execFileSync(cmd, args);
            child_process.execSync(`chmod +x ${bouhekiPath}`);
        }
        if (!fs.existsSync(systemdUnitFilePath)) {
            fs.writeFileSync(systemdUnitFilePath, systemdUnitFile);
            child_process.execSync("sudo systemctl daemon-reload");
        }
        child_process.execSync("sudo systemctl start bouheki");
    }
    catch (error) {
        core.setFailed(error.message);
    }
}))();
