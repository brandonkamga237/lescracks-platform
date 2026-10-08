package com.brandonkamga.lescracks.seo.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CrackLabSeoControllerTest {

    @Test
    @DisplayName("a Markdown statement becomes plain prose a crawler can index")
    void markdownBecomesPlainProse() {
        String markdown = "## Contexte\nUne API répond en **2 s**.\n\n- Lis le [profil](https://x.dev)\n\n```sql\nSELECT 1;\n```";

        assertThat(CrackLabSeoController.plain(markdown)).isEqualTo("Contexte Une API répond en 2 s. Lis le profil SELECT 1;");
    }
}
