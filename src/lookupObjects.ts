import { Vault } from "obsidian";

const NAME_REGEX = /\/@([^/]+)\.md$/;
const LOCATION_REGEX = /\/!([^/]+)\.md$/;

export const getAllMatchingFilesByType = async (
	vault: Vault
): Promise<{
	people: Record<string, string>;
	locations: Record<string, string>;
}> => {
	const files = vault.getFiles();
	const people: Record<string, string> = {};
	const locations: Record<string, string> = {};

	files.forEach((file) => {
		const nameMatch = NAME_REGEX.exec(file.path);
		const locationMatch = LOCATION_REGEX.exec(file.path);

		if (nameMatch) {
			people[nameMatch[1]] = file.path;
		} else if (locationMatch) {
			locations[locationMatch[1]] = file.path;
		}
	});

	return { people, locations };
};
