import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from "obsidian";
import { JournalHelperSettings } from "./settings";

class JournalSuggestInfo {
	suggestionOperation: "set" | "create";
	suggestionType: "Name" | "Location";
	suggestion: string;
	context: EditorSuggestContext;
}

export class JournalSuggest extends EditorSuggest<JournalSuggestInfo> {
	settings: JournalHelperSettings;
	peopleMap: Record<string, unknown> = {};
	locationMap: Record<string, unknown> = {};

	constructor(app: App, settings: JournalHelperSettings) {
		super(app);
		this.settings = settings;
	}

	updateMaps(
		people: Record<string, unknown>,
		locations: Record<string, unknown>
	) {
		// Update the maps local to the suggestor
		// Could be improved to just "global" maps for the vault
		this.peopleMap = people;
		this.locationMap = locations;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		file: TFile | null
	): EditorSuggestTriggerInfo | null {
		let triggerIndex = -1;
		let selectedSuggestionType = "";

		const charsLeftOfCursor = editor
			.getLine(cursor.line)
			.substring(0, cursor.ch);

		const nameIndex = charsLeftOfCursor.lastIndexOf("@");
		const locationIndex = charsLeftOfCursor.lastIndexOf("!");

		// Select the trigger that is closest to the cursor
		if (
			nameIndex >= 0 &&
			(locationIndex === -1 || nameIndex > locationIndex)
		) {
			triggerIndex = nameIndex;
			selectedSuggestionType = "Name";
		} else if (
			locationIndex >= 0 &&
			(nameIndex === -1 || locationIndex > nameIndex)
		) {
			triggerIndex = locationIndex;
			selectedSuggestionType = "Location";
		}

		// The triggerQuery is a combination of the selected suggestion type and the text after the trigger
		// It is of the form: suggestionType_query
		// The 'query' will be used to search for suggestions
		// Example: Name_John Doe -> This will trigger a suggestion for a person 'John Doe'
		const triggerQuery =
			triggerIndex >= 0 &&
			`${selectedSuggestionType}_${charsLeftOfCursor.substring(
				triggerIndex + 1
			)}`;

		// In cases where the trigger index is capturing an existing link, we don't want to trigger a suggestion
		// To avoid this, we check if the trigger query contains ']]' which is the closing bracket for a link
		// Also if the character before the trigger is a space, we can assume that the trigger is not part of a link
		if (
			triggerQuery &&
			!triggerQuery.includes("]]") &&
			(triggerIndex === 0 || charsLeftOfCursor[triggerIndex - 1] === " ")
		) {
			return {
				start: { line: cursor.line, ch: triggerIndex },
				end: { line: cursor.line, ch: cursor.ch },
				query: triggerQuery,
			};
		}
		return null;
	}

	getSuggestions(
		context: EditorSuggestContext
	): JournalSuggestInfo[] | Promise<JournalSuggestInfo[]> {
		let suggestions: JournalSuggestInfo[] = [];

		const queryType = context.query.split("_")[0];
		const queryText = context.query.split("_")[1];
		const queryMap =
			queryType === "Name" ? this.peopleMap : this.locationMap;

		// 'Set' suggestions are the existing values in the map that match the query
		suggestions = Object.keys(queryMap)
			.filter((key) => key.startsWith(queryText))
			.map((key) => {
				return {
					suggestionOperation: "set",
					suggestionType: queryType as "Name" | "Location",
					suggestion: key,
					context: context,
				};
			});

		// If no existing values are found in the map, suggest creating a new one
		if (suggestions.length === 0) {
			suggestions.push({
				suggestionOperation: "create",
				suggestionType: queryType as "Name" | "Location",
				suggestion: queryText,
				context: context,
			});
		}

		return suggestions;
	}

	renderSuggestion(value: JournalSuggestInfo, elem: HTMLElement): void {
		if (value.suggestionOperation === "create")
			elem.setText(`New ${value.suggestionType}: ` + value.suggestion);
		else elem.setText(value.suggestion);
	}

	selectSuggestion(
		value: JournalSuggestInfo,
		evt: MouseEvent | KeyboardEvent
	): void {
		const prefix = value.context.query.split("_")[0] === "Name" ? "@" : "!";
		const explicitFolder =
			prefix === "@"
				? this.settings.peopleFolder
				: this.settings.locationsFolder;

		if (value.suggestionOperation === "create") {
			// Create a new file with the given display text
			this.app.vault.create(
				this.app.vault.getRoot().path +
					`${explicitFolder}${prefix}${value.suggestion}.md`,
				`# ${value.suggestion}`
			);
		}

		// Replace the query with the selected suggestion link
		value.context.editor.replaceRange(
			`[[${explicitFolder}${prefix}${value.suggestion}.md|${prefix}${value.suggestion}]]`,
			value.context.start,
			value.context.end
		);
	}
}
