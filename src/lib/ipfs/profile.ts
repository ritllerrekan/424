import { uploadJSON, uploadFile, retrieveContent } from './pinata';
import { UserProfileData, IPFSUploadResult } from './types';

export async function uploadUserProfile(
  profile: UserProfileData
): Promise<IPFSUploadResult> {
  try {
    const result = await uploadJSON(profile, {
      name: `profile-${profile.userId}`,
      keyvalues: {
        type: 'user-profile',
        userId: profile.userId,
        role: profile.role,
      },
    });

    return result;
  } catch (error) {
    console.error('Failed to upload user profile:', error);
    throw new Error(`Failed to upload user profile: ${(error as Error).message}`);
  }
}

export async function uploadProfileImage(
  userId: string,
  image: File
): Promise<IPFSUploadResult> {
  try {
    const result = await uploadFile(image, {
      name: `profile-image-${userId}-${image.name}`,
      keyvalues: {
        type: 'profile-image',
        userId,
      },
    });

    return result;
  } catch (error) {
    console.error('Failed to upload profile image:', error);
    throw new Error(`Failed to upload profile image: ${(error as Error).message}`);
  }
}

export async function uploadCertification(
  userId: string,
  certification: File
): Promise<IPFSUploadResult> {
  try {
    const result = await uploadFile(certification, {
      name: `certification-${userId}-${certification.name}`,
      keyvalues: {
        type: 'certification',
        userId,
      },
    });

    return result;
  } catch (error) {
    console.error('Failed to upload certification:', error);
    throw new Error(`Failed to upload certification: ${(error as Error).message}`);
  }
}

export async function uploadCompleteProfile(
  profile: UserProfileData,
  profileImage?: File,
  certifications?: File[]
): Promise<{
  profile: IPFSUploadResult;
  profileImage?: IPFSUploadResult;
  certifications: IPFSUploadResult[];
}> {
  try {
    const profileImageResult = profileImage
      ? await uploadProfileImage(profile.userId, profileImage)
      : undefined;

    const certificationResults = certifications && certifications.length > 0
      ? await Promise.all(
          certifications.map(cert => uploadCertification(profile.userId, cert))
        )
      : [];

    const enrichedProfile: UserProfileData = {
      ...profile,
      profileImage: profileImageResult?.cid,
      certifications: certificationResults.map(r => r.cid),
    };

    const profileResult = await uploadUserProfile(enrichedProfile);

    return {
      profile: profileResult,
      profileImage: profileImageResult,
      certifications: certificationResults,
    };
  } catch (error) {
    console.error('Failed to upload complete profile:', error);
    throw new Error(`Failed to upload complete profile: ${(error as Error).message}`);
  }
}

export async function retrieveUserProfile(cid: string): Promise<UserProfileData> {
  try {
    const profile = await retrieveContent(cid);
    return profile as UserProfileData;
  } catch (error) {
    console.error('Failed to retrieve user profile:', error);
    throw new Error(`Failed to retrieve user profile: ${(error as Error).message}`);
  }
}

export async function retrieveProfileWithAssets(
  profileCid: string
): Promise<{
  profile: UserProfileData;
  profileImageUrl?: string;
  certificationUrls: string[];
}> {
  try {
    const profile = await retrieveUserProfile(profileCid);

    const gatewayBase = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';

    const profileImageUrl = profile.profileImage
      ? `${gatewayBase}${profile.profileImage}`
      : undefined;

    const certificationUrls = profile.certifications?.map(cid =>
      `${gatewayBase}${cid}`
    ) || [];

    return {
      profile,
      profileImageUrl,
      certificationUrls,
    };
  } catch (error) {
    console.error('Failed to retrieve profile with assets:', error);
    throw new Error(`Failed to retrieve profile with assets: ${(error as Error).message}`);
  }
}
