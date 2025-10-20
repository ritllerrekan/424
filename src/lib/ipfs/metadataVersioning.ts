import { AnyMetadata, METADATA_VERSION } from './schemas';

export interface MetadataHistory {
  cid: string;
  version: string;
  updatedAt: string;
  updatedBy?: string;
  changeLog?: string;
}

export interface VersionedMetadata {
  current: AnyMetadata;
  currentCID: string;
  history: MetadataHistory[];
}

export class MetadataVersionManager {
  static createVersionedMetadata(
    metadata: AnyMetadata,
    cid: string,
    updatedBy?: string,
    changeLog?: string
  ): VersionedMetadata {
    return {
      current: metadata,
      currentCID: cid,
      history: [
        {
          cid,
          version: metadata.version || METADATA_VERSION,
          updatedAt: metadata.updatedAt || new Date().toISOString(),
          updatedBy,
          changeLog,
        },
      ],
    };
  }

  static addVersion(
    versioned: VersionedMetadata,
    newMetadata: AnyMetadata,
    newCID: string,
    updatedBy?: string,
    changeLog?: string
  ): VersionedMetadata {
    const historyEntry: MetadataHistory = {
      cid: newCID,
      version: newMetadata.version || METADATA_VERSION,
      updatedAt: newMetadata.updatedAt || new Date().toISOString(),
      updatedBy,
      changeLog,
    };

    return {
      current: newMetadata,
      currentCID: newCID,
      history: [...versioned.history, historyEntry],
    };
  }

  static getLatestVersion(versioned: VersionedMetadata): {
    metadata: AnyMetadata;
    cid: string;
  } {
    return {
      metadata: versioned.current,
      cid: versioned.currentCID,
    };
  }

  static getVersionHistory(versioned: VersionedMetadata): MetadataHistory[] {
    return [...versioned.history].reverse();
  }

  static getVersionByCID(
    versioned: VersionedMetadata,
    cid: string
  ): MetadataHistory | undefined {
    return versioned.history.find((h) => h.cid === cid);
  }

  static getVersionByTimestamp(
    versioned: VersionedMetadata,
    timestamp: string
  ): MetadataHistory | undefined {
    const targetDate = new Date(timestamp);
    return versioned.history
      .filter((h) => new Date(h.updatedAt) <= targetDate)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  }

  static compareVersions(
    versioned: VersionedMetadata,
    cidA: string,
    cidB: string
  ): {
    older: MetadataHistory | undefined;
    newer: MetadataHistory | undefined;
    timeDifference?: number;
  } {
    const versionA = versioned.history.find((h) => h.cid === cidA);
    const versionB = versioned.history.find((h) => h.cid === cidB);

    if (!versionA || !versionB) {
      return { older: undefined, newer: undefined };
    }

    const dateA = new Date(versionA.updatedAt).getTime();
    const dateB = new Date(versionB.updatedAt).getTime();

    if (dateA < dateB) {
      return {
        older: versionA,
        newer: versionB,
        timeDifference: dateB - dateA,
      };
    } else {
      return {
        older: versionB,
        newer: versionA,
        timeDifference: dateA - dateB,
      };
    }
  }

  static rollbackToVersion(
    versioned: VersionedMetadata,
    cid: string,
    updatedBy?: string,
    changeLog?: string
  ): VersionedMetadata | null {
    const targetVersion = versioned.history.find((h) => h.cid === cid);
    if (!targetVersion) {
      return null;
    }

    const indexOfTarget = versioned.history.findIndex((h) => h.cid === cid);

    const historyEntry: MetadataHistory = {
      cid: targetVersion.cid,
      version: targetVersion.version,
      updatedAt: new Date().toISOString(),
      updatedBy,
      changeLog: changeLog || `Rolled back to version from ${targetVersion.updatedAt}`,
    };

    return {
      current: versioned.current,
      currentCID: targetVersion.cid,
      history: [...versioned.history.slice(0, indexOfTarget + 1), historyEntry],
    };
  }

  static getTotalVersions(versioned: VersionedMetadata): number {
    return versioned.history.length;
  }

  static isLatestVersion(versioned: VersionedMetadata, cid: string): boolean {
    return versioned.currentCID === cid;
  }

  static migrateLegacyMetadata(
    legacyMetadata: any,
    schemaType: string
  ): AnyMetadata {
    const now = new Date().toISOString();

    const baseMetadata = {
      version: METADATA_VERSION,
      schemaType,
      createdAt: legacyMetadata.timestamp || now,
      updatedAt: now,
      isValid: true,
    };

    return {
      ...baseMetadata,
      ...legacyMetadata,
    } as AnyMetadata;
  }
}

export function generateChangeLog(
  oldMetadata: AnyMetadata,
  newMetadata: AnyMetadata
): string {
  const changes: string[] = [];

  const oldKeys = Object.keys(oldMetadata);
  const newKeys = Object.keys(newMetadata);

  newKeys.forEach((key) => {
    if (key === 'updatedAt' || key === 'version') return;

    const oldValue = (oldMetadata as any)[key];
    const newValue = (newMetadata as any)[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      if (oldKeys.includes(key)) {
        changes.push(`Updated ${key}`);
      } else {
        changes.push(`Added ${key}`);
      }
    }
  });

  oldKeys.forEach((key) => {
    if (!newKeys.includes(key) && key !== 'updatedAt' && key !== 'version') {
      changes.push(`Removed ${key}`);
    }
  });

  return changes.length > 0 ? changes.join(', ') : 'No changes detected';
}
