import { IsArray, IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

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

    @IsOptional()
    @IsString()
    name?: string;
}
