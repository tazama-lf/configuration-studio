import { BadRequestException } from '@nestjs/common';
import { validateConfigPayload } from './config-payload.validator';

/**
 * The documented payloads from docs/CONFIG_GUIDE.md and docs/report.md.
 * They must keep passing: the DTOs exist to catch malformed bodies, not to
 * tighten what admin-service already accepts.
 */
const documentedRulePayload = {
  id: 'tenant-001-901@1.0.0',
  cfg: '1.0.0',
  desc: 'Number of outgoing transactions - debtor',
  tenantId: 'tenant-001',
  config: {
    parameters: { maxQueryRange: 86400000 },
    exitConditions: [{ subRuleRef: '.x00', reason: 'Unsuccessful' }],
    bands: [{ subRuleRef: '.01', reason: 'one transaction', upperLimit: 2 }],
  },
};

const documentedTypologyPayload = {
  id: 'tenant-001-typology-001@1.0.0',
  cfg: '999@1.0.0',
  desc: 'Typology-999-Rule-901-and-902',
  tenantId: 'tenant-001',
  rules: [
    {
      id: '901@1.0.0',
      cfg: '1.0.0',
      wghts: [{ ref: '.err', wght: 0 }],
      termId: 'v901at100at100',
    },
  ],
  workflow: {
    flowProcessor: 'EFRuP@1.0.0',
    alertThreshold: 30,
    interdictionThreshold: 50,
  },
  expression: ['Add', 'v901at100at100'],
};

const documentedNetworkMapPayload = {
  cfg: '1.0.0',
  name: 'Public Network Map',
  active: true,
  tenantId: 'tenant-001',
  messages: [
    {
      id: '004@1.0.0',
      cfg: '1.0.0',
      txTp: 'pacs.002.001.12',
      typologies: [
        {
          id: 'tenant-001-typology-001@1.0.0',
          cfg: '999@1.0.0',
          rules: [{ id: 'EFRuP@1.0.0', cfg: 'none' }],
          tenantId: 'tenant-001',
        },
      ],
    },
  ],
};

describe('validateConfigPayload', () => {
  describe('documented payloads keep working', () => {
    it('accepts a rule payload', () => {
      expect(() => validateConfigPayload('rule', documentedRulePayload)).not.toThrow();
    });

    it('accepts a typology payload', () => {
      expect(() => validateConfigPayload('typology', documentedTypologyPayload)).not.toThrow();
    });

    it('accepts a network map payload', () => {
      expect(() => validateConfigPayload('network_map', documentedNetworkMapPayload)).not.toThrow();
    });

    it('accepts a network map without the optional active/name fields', () => {
      expect(() =>
        validateConfigPayload('network_map', { cfg: '1.0.0', messages: [] }),
      ).not.toThrow();
    });

    it('accepts a payload without tenantId', () => {
      const { tenantId, ...ruleWithoutTenant } = documentedRulePayload;
      expect(tenantId).toBe('tenant-001');

      expect(() => validateConfigPayload('rule', ruleWithoutTenant)).not.toThrow();
    });
  });

  describe('unknown properties are tolerated', () => {
    it('leaves extra top-level properties untouched instead of rejecting them', () => {
      const withExtras = {
        ...documentedRulePayload,
        creDtTm: '2026-01-01T00:00:00.000Z',
        updDtTm: '2026-01-01T00:00:00.000Z',
        somethingUnknown: 'kept',
      };

      expect(() => validateConfigPayload('rule', withExtras)).not.toThrow();
    });
  });

  describe('non-object bodies', () => {
    it('rejects a null body', () => {
      expect(() => validateConfigPayload('rule', null)).toThrow(BadRequestException);
    });

    it('rejects a string body', () => {
      expect(() => validateConfigPayload('rule', 'not-an-object')).toThrow(BadRequestException);
    });

    it('rejects an array body', () => {
      expect(() => validateConfigPayload('rule', [])).toThrow(BadRequestException);
    });
  });

  describe('rule payloads', () => {
    it('rejects a missing desc, which the docs and UI both require', () => {
      const { desc, ...withoutDesc } = documentedRulePayload;
      expect(desc).toBeDefined();

      expect(() => validateConfigPayload('rule', withoutDesc)).toThrow(BadRequestException);
    });

    it('rejects a missing id', () => {
      const { id, ...withoutId } = documentedRulePayload;
      expect(id).toBeDefined();

      expect(() => validateConfigPayload('rule', withoutId)).toThrow(BadRequestException);
    });

    it('rejects a missing cfg', () => {
      const { cfg, ...withoutCfg } = documentedRulePayload;
      expect(cfg).toBeDefined();

      expect(() => validateConfigPayload('rule', withoutCfg)).toThrow(BadRequestException);
    });

    it('rejects a cfg sent as a number', () => {
      expect(() =>
        validateConfigPayload('rule', { ...documentedRulePayload, cfg: 999 }),
      ).toThrow(BadRequestException);
    });

    it('rejects a config sent as a string', () => {
      expect(() =>
        validateConfigPayload('rule', { ...documentedRulePayload, config: '{}' }),
      ).toThrow(BadRequestException);
    });

    it('rejects a tenantId that is not a string', () => {
      expect(() =>
        validateConfigPayload('rule', { ...documentedRulePayload, tenantId: 42 }),
      ).toThrow(BadRequestException);
    });
  });

  describe('typology payloads', () => {
    it.each([
      ['rules', { rules: {} }],
      ['expression', { expression: {} }],
      ['workflow', { workflow: 'none' }],
      ['desc', { desc: undefined }],
    ])('rejects an invalid %s', (_field, override) => {
      expect(() =>
        validateConfigPayload('typology', { ...documentedTypologyPayload, ...override }),
      ).toThrow(BadRequestException);
    });
  });

  describe('network map payloads', () => {
    it.each([
      ['messages', { messages: {} }],
      ['active', { active: 'yes' }],
      ['name', { name: 12 }],
      ['cfg', { cfg: 1 }],
    ])('rejects an invalid %s', (_field, override) => {
      expect(() =>
        validateConfigPayload('network_map', { ...documentedNetworkMapPayload, ...override }),
      ).toThrow(BadRequestException);
    });
  });

  describe('error messages', () => {
    it('returns the validation messages so the client can explain the failure', () => {
      let error: BadRequestException | undefined;
      try {
        validateConfigPayload('rule', { cfg: '1.0.0', config: {} });
      } catch (thrown) {
        error = thrown as BadRequestException;
      }

      const response = error?.getResponse() as { message: string[] };
      expect(response.message).toContain('desc must be a string');
      expect(response.message).toContain('id must be a string');
    });
  });
});
