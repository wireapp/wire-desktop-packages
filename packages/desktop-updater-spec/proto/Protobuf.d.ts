import * as $protobuf from "protobufjs";
export namespace updater {

    interface IUpdateData {
        author?: (string[]|null);
        changelog?: (string|null);
        expiresOn?: (string|null);
        fileChecksum?: (Uint8Array|null);
        fileChecksumCompressed?: (Uint8Array|null);
        fileContentLength?: (number|Long|null);
        minimumClientVersion?: (string|null);
        minimumWebAppVersion?: (string|null);
        releaseDate?: (string|null);
        specVersion?: (number|null);
        targetEnvironment?: (string|null);
        webappVersionNumber?: (string|null);
    }

    class UpdateData implements IUpdateData {
        constructor(properties?: updater.IUpdateData);
        public author: string[];
        public changelog: string;
        public expiresOn: string;
        public fileChecksum: Uint8Array;
        public fileChecksumCompressed: Uint8Array;
        public fileContentLength: (number|Long);
        public minimumClientVersion: string;
        public minimumWebAppVersion: string;
        public releaseDate: string;
        public specVersion: number;
        public targetEnvironment: string;
        public webappVersionNumber: string;
        public static create(properties?: updater.IUpdateData): updater.UpdateData;
        public static encode(message: updater.IUpdateData, writer?: $protobuf.Writer): $protobuf.Writer;
        public static encodeDelimited(message: updater.IUpdateData, writer?: $protobuf.Writer): $protobuf.Writer;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): updater.UpdateData;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): updater.UpdateData;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): updater.UpdateData;
        public static toObject(message: updater.UpdateData, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
    }

    interface IUpdateMessage {
        data: Uint8Array;
        publicKey: Uint8Array;
        signature: Uint8Array;
    }

    class UpdateMessage implements IUpdateMessage {
        constructor(properties?: updater.IUpdateMessage);
        public data: Uint8Array;
        public publicKey: Uint8Array;
        public signature: Uint8Array;
        public static create(properties?: updater.IUpdateMessage): updater.UpdateMessage;
        public static encode(message: updater.IUpdateMessage, writer?: $protobuf.Writer): $protobuf.Writer;
        public static encodeDelimited(message: updater.IUpdateMessage, writer?: $protobuf.Writer): $protobuf.Writer;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): updater.UpdateMessage;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): updater.UpdateMessage;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): updater.UpdateMessage;
        public static toObject(message: updater.UpdateMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
    }
}
