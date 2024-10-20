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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.relative = exports.safePointerToPath = exports.toFileSystemPath = exports.fromFileSystemPath = exports.isFileSystemPath = exports.isHttp = exports.stripHash = exports.getHash = exports.stripQuery = exports.getExtension = exports.getProtocol = exports.cwd = exports.resolve = exports.parse = void 0;
const convert_path_to_posix_1 = __importDefault(require("./convert-path-to-posix"));
const path_1 = __importStar(require("path"));
const forwardSlashPattern = /\//g;
const protocolPattern = /^(\w{2,}):\/\//i;
const jsonPointerSlash = /~1/g;
const jsonPointerTilde = /~0/g;
const path_2 = require("path");
const is_windows_1 = require("./is-windows");
// RegExp patterns to URL-encode special characters in local filesystem paths
const urlEncodePatterns = [
    [/\?/g, "%3F"],
    [/#/g, "%23"],
];
// RegExp patterns to URL-decode special characters for local filesystem paths
const urlDecodePatterns = [/%23/g, "#", /%24/g, "$", /%26/g, "&", /%2C/g, ",", /%40/g, "@"];
const parse = (u) => new URL(u);
exports.parse = parse;
/**
 * Returns resolved target URL relative to a base URL in a manner similar to that of a Web browser resolving an anchor tag HREF.
 *
 * @returns
 */
function resolve(from, to) {
    const fromUrl = new URL((0, convert_path_to_posix_1.default)(from), "resolve://");
    const resolvedUrl = new URL((0, convert_path_to_posix_1.default)(to), fromUrl);
    const endSpaces = to.match(/(\s*)$/)?.[1] || "";
    if (resolvedUrl.protocol === "resolve:") {
        // `from` is a relative URL.
        const { pathname, search, hash } = resolvedUrl;
        return pathname + search + hash + endSpaces;
    }
    return resolvedUrl.toString() + endSpaces;
}
exports.resolve = resolve;
/**
 * Returns the current working directory (in Node) or the current page URL (in browsers).
 *
 * @returns
 */
function cwd() {
    if (typeof window !== "undefined") {
        return location.href;
    }
    const path = process.cwd();
    const lastChar = path.slice(-1);
    if (lastChar === "/" || lastChar === "\\") {
        return path;
    }
    else {
        return path + "/";
    }
}
exports.cwd = cwd;
/**
 * Returns the protocol of the given URL, or `undefined` if it has no protocol.
 *
 * @param path
 * @returns
 */
function getProtocol(path) {
    const match = protocolPattern.exec(path || "");
    if (match) {
        return match[1].toLowerCase();
    }
    return undefined;
}
exports.getProtocol = getProtocol;
/**
 * Returns the lowercased file extension of the given URL,
 * or an empty string if it has no extension.
 *
 * @param path
 * @returns
 */
function getExtension(path) {
    const lastDot = path.lastIndexOf(".");
    if (lastDot >= 0) {
        return stripQuery(path.substr(lastDot).toLowerCase());
    }
    return "";
}
exports.getExtension = getExtension;
/**
 * Removes the query, if any, from the given path.
 *
 * @param path
 * @returns
 */
function stripQuery(path) {
    const queryIndex = path.indexOf("?");
    if (queryIndex >= 0) {
        path = path.substr(0, queryIndex);
    }
    return path;
}
exports.stripQuery = stripQuery;
/**
 * Returns the hash (URL fragment), of the given path.
 * If there is no hash, then the root hash ("#") is returned.
 *
 * @param path
 * @returns
 */
function getHash(path) {
    if (!path) {
        return "#";
    }
    const hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
        return path.substring(hashIndex);
    }
    return "#";
}
exports.getHash = getHash;
/**
 * Removes the hash (URL fragment), if any, from the given path.
 *
 * @param path
 * @returns
 */
function stripHash(path) {
    if (!path) {
        return "";
    }
    const hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
        path = path.substring(0, hashIndex);
    }
    return path;
}
exports.stripHash = stripHash;
/**
 * Determines whether the given path is an HTTP(S) URL.
 *
 * @param path
 * @returns
 */
function isHttp(path) {
    const protocol = getProtocol(path);
    if (protocol === "http" || protocol === "https") {
        return true;
    }
    else if (protocol === undefined) {
        // There is no protocol.  If we're running in a browser, then assume it's HTTP.
        return typeof window !== "undefined";
    }
    else {
        // It's some other protocol, such as "ftp://", "mongodb://", etc.
        return false;
    }
}
exports.isHttp = isHttp;
/**
 * Determines whether the given path is a filesystem path.
 * This includes "file://" URLs.
 *
 * @param path
 * @returns
 */
function isFileSystemPath(path) {
    // @ts-ignore
    if (typeof window !== "undefined" || process.browser) {
        // We're running in a browser, so assume that all paths are URLs.
        // This way, even relative paths will be treated as URLs rather than as filesystem paths
        return false;
    }
    const protocol = getProtocol(path);
    return protocol === undefined || protocol === "file";
}
exports.isFileSystemPath = isFileSystemPath;
/**
 * Converts a filesystem path to a properly-encoded URL.
 *
 * This is intended to handle situations where JSON Schema $Ref Parser is called
 * with a filesystem path that contains characters which are not allowed in URLs.
 *
 * @example
 * The following filesystem paths would be converted to the following URLs:
 *
 *    <"!@#$%^&*+=?'>.json              ==>   %3C%22!@%23$%25%5E&*+=%3F\'%3E.json
 *    C:\\My Documents\\File (1).json   ==>   C:/My%20Documents/File%20(1).json
 *    file://Project #42/file.json      ==>   file://Project%20%2342/file.json
 *
 * @param path
 * @returns
 */
function fromFileSystemPath(path) {
    // Step 1: On Windows, replace backslashes with forward slashes,
    // rather than encoding them as "%5C"
    if ((0, is_windows_1.isWindows)()) {
        const projectDir = cwd();
        const upperPath = path.toUpperCase();
        const projectDirPosixPath = (0, convert_path_to_posix_1.default)(projectDir);
        const posixUpper = projectDirPosixPath.toUpperCase();
        const hasProjectDir = upperPath.includes(posixUpper);
        const hasProjectUri = upperPath.includes(posixUpper);
        const isAbsolutePath = path_1.win32?.isAbsolute(path) ||
            path.startsWith("http://") ||
            path.startsWith("https://") ||
            path.startsWith("file://");
        if (!(hasProjectDir || hasProjectUri || isAbsolutePath) && !projectDir.startsWith("http")) {
            path = (0, path_2.join)(projectDir, path);
        }
        path = (0, convert_path_to_posix_1.default)(path);
    }
    // Step 2: `encodeURI` will take care of MOST characters
    path = encodeURI(path);
    // Step 3: Manually encode characters that are not encoded by `encodeURI`.
    // This includes characters such as "#" and "?", which have special meaning in URLs,
    // but are just normal characters in a filesystem path.
    for (const pattern of urlEncodePatterns) {
        path = path.replace(pattern[0], pattern[1]);
    }
    return path;
}
exports.fromFileSystemPath = fromFileSystemPath;
/**
 * Converts a URL to a local filesystem path.
 */
function toFileSystemPath(path, keepFileProtocol) {
    // Step 1: `decodeURI` will decode characters such as Cyrillic characters, spaces, etc.
    path = decodeURI(path);
    // Step 2: Manually decode characters that are not decoded by `decodeURI`.
    // This includes characters such as "#" and "?", which have special meaning in URLs,
    // but are just normal characters in a filesystem path.
    for (let i = 0; i < urlDecodePatterns.length; i += 2) {
        path = path.replace(urlDecodePatterns[i], urlDecodePatterns[i + 1]);
    }
    // Step 3: If it's a "file://" URL, then format it consistently
    // or convert it to a local filesystem path
    let isFileUrl = path.substr(0, 7).toLowerCase() === "file://";
    if (isFileUrl) {
        // Strip-off the protocol, and the initial "/", if there is one
        path = path[7] === "/" ? path.substr(8) : path.substr(7);
        // insert a colon (":") after the drive letter on Windows
        if ((0, is_windows_1.isWindows)() && path[1] === "/") {
            path = path[0] + ":" + path.substr(1);
        }
        if (keepFileProtocol) {
            // Return the consistently-formatted "file://" URL
            path = "file:///" + path;
        }
        else {
            // Convert the "file://" URL to a local filesystem path.
            // On Windows, it will start with something like "C:/".
            // On Posix, it will start with "/"
            isFileUrl = false;
            path = (0, is_windows_1.isWindows)() ? path : "/" + path;
        }
    }
    // Step 4: Normalize Windows paths (unless it's a "file://" URL)
    if ((0, is_windows_1.isWindows)() && !isFileUrl) {
        // Replace forward slashes with backslashes
        path = path.replace(forwardSlashPattern, "\\");
        // Capitalize the drive letter
        if (path.substr(1, 2) === ":\\") {
            path = path[0].toUpperCase() + path.substr(1);
        }
    }
    return path;
}
exports.toFileSystemPath = toFileSystemPath;
/**
 * Converts a $ref pointer to a valid JSON Path.
 *
 * @param pointer
 * @returns
 */
function safePointerToPath(pointer) {
    if (pointer.length <= 1 || pointer[0] !== "#" || pointer[1] !== "/") {
        return [];
    }
    return pointer
        .slice(2)
        .split("/")
        .map((value) => {
        return decodeURIComponent(value).replace(jsonPointerSlash, "/").replace(jsonPointerTilde, "~");
    });
}
exports.safePointerToPath = safePointerToPath;
function relative(from, to) {
    if (!isFileSystemPath(from) || !isFileSystemPath(to)) {
        return resolve(from, to);
    }
    const fromDir = path_1.default.dirname(stripHash(from));
    const toPath = stripHash(to);
    const result = path_1.default.relative(fromDir, toPath);
    return result + getHash(to);
}
exports.relative = relative;
