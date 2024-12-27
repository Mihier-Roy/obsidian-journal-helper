import MyPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface JournalHelperSettings {
	peopleFolder: string;
	locationsFolder: string;
}

export const DEFAULT_SETTINGS: JournalHelperSettings = {
	peopleFolder: "_people/",
	locationsFolder: "_locations/",
};

export class JournalHelperSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("People Folder")
			.setDesc("File path of the 'People' folder within your vault")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.peopleFolder)
					.setValue(this.plugin.settings.peopleFolder)
					.onChange(async (value) => {
						this.plugin.settings.peopleFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Location Folder")
			.setDesc("File path of the 'Location' folder within your vault")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.locationsFolder)
					.setValue(this.plugin.settings.locationsFolder)
					.onChange(async (value) => {
						this.plugin.settings.locationsFolder = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
