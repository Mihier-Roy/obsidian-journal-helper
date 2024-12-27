import { Plugin, TAbstractFile } from "obsidian";
import { JournalSuggest } from "./src/journalSuggestions";
import {
	DEFAULT_SETTINGS,
	JournalHelperSettings,
	JournalHelperSettingTab,
} from "./src/settings";
import { getAllMatchingFilesByType } from "src/lookupObjects";

export default class JournalHelperPlugin extends Plugin {
	settings: JournalHelperSettings;
	suggestor: JournalSuggest;
	peopleMap: Record<string, string>;
	locationMap: Record<string, string>;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new JournalHelperSettingTab(this.app, this));
		this.registerEvent(
			this.app.vault.on("create", async (event) => {
				await this.update(event);
			})
		);
		this.registerEvent(
			this.app.vault.on("delete", async (event) => {
				await this.update(event);
			})
		);
		this.registerEvent(
			this.app.vault.on("rename", async (event) => {
				await this.update(event);
			})
		);
		this.suggestor = new JournalSuggest(this.app, this.settings);
		this.registerEditorSuggest(this.suggestor);
		this.app.workspace.onLayoutReady(this.initialize);
	}

	initialize = async () => {
		// Triggered when the plugin is loaded - runs once at startup
		// Check if the people and location folders exist, if not create them
		const vaultFolders = this.app.vault.getAllFolders();
		const peopleFolderExists = vaultFolders.find(
			(folder) =>
				folder.path === this.settings.peopleFolder.replace("/", "")
		);
		const locationsFolderExists = vaultFolders.find(
			(folder) =>
				folder.path === this.settings.locationsFolder.replace("/", "")
		);

		if (!peopleFolderExists)
			await this.app.vault.createFolder(this.settings.peopleFolder);

		if (!locationsFolderExists)
			await this.app.vault.createFolder(this.settings.locationsFolder);

		// Update the people and location maps with the current files
		const maps = await getAllMatchingFilesByType(this.app.vault);
		window.setTimeout(() => {
			this.updateMaps(maps.people, maps.locations);
		});
	};

	update = async ({ path, ...remaining }: TAbstractFile) => {
		// This function is triggered everytime there is an update to the vault
		// Update the people and location maps with the current files
		this.peopleMap = this.peopleMap || {};
		this.locationMap = this.locationMap || {};

		const maps = await getAllMatchingFilesByType(this.app.vault);

		this.updateMaps(maps.people, maps.locations);
	};

	updateMaps = (
		people: Record<string, string>,
		locations: Record<string, string>
	) => {
		this.peopleMap = people;
		this.locationMap = locations;

		this.suggestor.updateMaps(people, locations);
	};

	async loadSettings() {
		this.settings = {
			...DEFAULT_SETTINGS,
			...(await this.loadData()),
		};
	}

	async saveSettings() {
		await this.saveData(this.settings || DEFAULT_SETTINGS);
	}
}
