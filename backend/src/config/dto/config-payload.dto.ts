import { IsArray, IsBoolean, IsObject, IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Payload shapes accepted by the /config/* write endpoints.
 *
 * These DTOs only describe the fields this service can assert on its own —
 * the ones the UI always sends and that admin-service already requires. The
 * nested content of `config`, `messages`, `rules`, `expression` and `workflow`
 * is intentionally not validated here: admin-service owns those schemas and
 * they change with the configuration format.
 */

/** Fields shared by every config payload. */
class BaseConfigPayloadDto {
    @IsOptional()
    @IsString()
    tenantId?: string;
}

export class RulePayloadDto extends BaseConfigPayloadDto {
    @IsString()
    id!: string;

    @IsString()
    cfg!: string;

    /** Documented as required and enforced by the UI form. */
    @IsString()
    desc!: string;

    @IsObject()
    config!: Record<string, unknown>;
}

export class TypologyPayloadDto extends BaseConfigPayloadDto {
    @IsString()
    id!: string;

    @IsString()
    cfg!: string;

    /** Documented as required and enforced by the UI form. */
    @IsString()
    desc!: string;

    @IsArray()
    rules!: unknown[];

    @IsArray()
    expression!: unknown[];

    @IsObject()
    workflow!: Record<string, unknown>;
}

export class NetworkMapPayloadDto extends BaseConfigPayloadDto {
    @IsString()
    cfg!: string;

    @IsArray()
    messages!: unknown[];

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    /**
     * Required and non-blank on write (docs/report.md lists `name` as a
     * required field; the UI enforces 250 chars). Trimmed first so a
     * whitespace-only value (" ") is treated as blank and rejected, matching
     * the UI, rather than slipping past @IsNotEmpty().
     */
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty()
    @MaxLength(250)
    name!: string;
}
