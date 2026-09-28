import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import type { ConfigTable } from '../config-proxy.service';
import {
    NetworkMapPayloadDto,
    RulePayloadDto,
    TypologyPayloadDto,
} from './config-payload.dto';

const DTO_BY_TABLE: Record<ConfigTable, new () => object> = {
    rule: RulePayloadDto,
    typology: TypologyPayloadDto,
    network_map: NetworkMapPayloadDto,
};

function collectMessages(errors: ValidationError[]): string[] {
    const messages: string[] = [];
    for (const error of errors) {
        for (const constraint of Object.values(
            error.constraints as Record<string, string>,
        )) {
            messages.push(constraint);
        }
    }
    return messages;
}

/**
 * Validate a config write payload against the DTO for its table.
 *
 * Validation is invoked explicitly from the controller rather than through the
 * global ValidationPipe because that pipe runs with `forbidNonWhitelisted: true`.
 * Declaring these DTOs on `@Body()` would therefore reject any property they do
 * not list, and admin-service currently tolerates and drops unknown properties —
 * rejecting them would break existing clients. Unknown properties are left
 * untouched here; only the declared fields are checked.
 */
export function validateConfigPayload(table: ConfigTable, body: unknown): void {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        throw new BadRequestException('Request body must be a JSON object');
    }

    const dtoClass = DTO_BY_TABLE[table];
    const instance = plainToInstance(dtoClass, body as Record<string, unknown>);
    const errors = validateSync(instance);

    if (errors.length > 0) {
        throw new BadRequestException(collectMessages(errors));
    }
}
