// You must export any commands from this file in order for them to be parsed by the client

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import puzzle from './puzzle';

export type SlashCommand = {
	data: SlashCommandBuilder;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

export const commands = [
	puzzle,
]