/**
 * アイコンパス定義
 *
 * Chicago95 アイコンは jsDelivr CDN 経由で GitHub リポジトリから取得します。
 * バンドルサイズに影響せず、ライブラリ利用時に GPL ファイルをローカルに持たずに済みます。
 *
 * License: Chicago95 icons are licensed under GPL-3.0
 * https://github.com/grassmunk/Chicago95
 */
export type IconSize = 16 | 32;
export declare const ICONS: {
    readonly hardDrive: string;
    readonly floppyDrive: string;
    readonly cdDrive: string;
    readonly networkDrive: string;
    readonly removableDrive: string;
    readonly folderClosed: string;
    readonly folderOpen: string;
    readonly folderWindows: string;
    readonly folderSystem: string;
    readonly myComputer: string;
    readonly myDocuments: string;
    readonly recycleBinEmpty: string;
    readonly recycleBinFull: string;
    readonly desktop: string;
    readonly fileGeneric: string;
    readonly fileText: string;
    readonly fileExecutable: string;
    readonly fileImage: string;
    readonly fileHtml: string;
    readonly fileScript: string;
    readonly back: string;
    readonly forward: string;
    readonly up: string;
    readonly cut: string;
    readonly copy: string;
    readonly paste: string;
    readonly delete: string;
    readonly properties: string;
    readonly shellWindow: string;
    readonly windowsLogo: string;
    readonly windowsSlanted: string;
};
export type IconName = keyof typeof ICONS;
export declare function getFileIcon(filename: string): string;
