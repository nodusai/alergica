/**
 * Política de Privacidade (LGPD — Lei nº 13.709/2018).
 * Texto-modelo preparado a partir do funcionamento real do sistema. Revise com assessoria jurídica
 * e preencha os dados da empresa em src/config/legal.ts antes de publicar.
 * Ao mudar o conteúdo, aumente LEGAL.privacyVersion.
 */
import { Link } from "react-router-dom";
import LegalLayout from "@/components/LegalLayout";
import { LEGAL } from "@/config/legal";

const PrivacyPolicyPage = () => (
  <LegalLayout
    title="Política de Privacidade"
    version={LEGAL.privacyVersion}
    intro={
      <>
        Esta política explica, em linguagem simples, quais dados o AlerGica coleta, para que usa, com quem compartilha e
        como você exerce seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
      </>
    }
  >
    <h2>1. Quem cuida dos seus dados</h2>
    <p>
      O controlador dos dados é <strong>{LEGAL.controllerName}</strong>, CNPJ {LEGAL.controllerCnpj}, com sede em{" "}
      {LEGAL.controllerAddress}. O encarregado pelo tratamento de dados pessoais (DPO) é {LEGAL.dpoName}, que pode ser
      contatado pelo e-mail <strong>{LEGAL.dpoEmail}</strong>.
    </p>

    <h2>2. Quais dados coletamos</h2>
    <h3>Dados de cadastro</h3>
    <ul>
      <li>
        <strong>Obrigatórios:</strong> nome, e-mail, senha (guardada de forma criptografada, nem nós conseguimos lê-la),
        tipo de perfil (mãe, pai, pessoa alérgica, farmacêutico ou médico) e data de nascimento.
      </li>
      <li>
        <strong>Opcionais:</strong> sexo, cidade, estado, profissão e telefone.
      </li>
    </ul>
    <h3>Dados de saúde (dados sensíveis)</h3>
    <ul>
      <li>Alergias e observações de saúde que você informar no perfil ou no primeiro acesso.</li>
      <li>Nome e data de nascimento das crianças que você cadastrar.</li>
    </ul>
    <h3>Dados gerados pelo uso</h3>
    <ul>
      <li>Fotos de rótulos que você enviar para análise no módulo Produtos.</li>
      <li>Textos enviados ao assistente de IA (por exemplo, a descrição das suas alergias no primeiro acesso).</li>
      <li>Mensagens de suporte, sugestões e feedback.</li>
      <li>
        Registros de acesso (data, hora e endereço IP), mantidos pelos nossos provedores de infraestrutura, como exige o
        Marco Civil da Internet.
      </li>
    </ul>
    <p>
      Os remédios que você consulta <strong>não ficam ligados à sua conta</strong>: guardamos apenas um contador geral de
      quantas vezes cada remédio foi aberto, usado para mostrar os “Mais Procurados”.
    </p>

    <h2>3. Para que usamos e com qual base legal</h2>
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Finalidade</th>
            <th>Dados</th>
            <th>Base legal (LGPD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Criar e manter sua conta, permitir o login</td>
            <td>Cadastro</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Confirmar que a conta é de um adulto</td>
            <td>Data de nascimento</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Personalizar o app ao seu perfil de alergias e às crianças cadastradas</td>
            <td>Dados de saúde</td>
            <td>Consentimento específico e destacado (art. 11, I e art. 14, §1º)</td>
          </tr>
          <tr>
            <td>Analisar rótulos e organizar seu perfil de alergias com IA</td>
            <td>Fotos e textos enviados</td>
            <td>Consentimento específico e destacado (art. 11, I)</td>
          </tr>
          <tr>
            <td>Responder suporte, sugestões e feedback e melhorar o app</td>
            <td>Mensagens enviadas</td>
            <td>Legítimo interesse (art. 7º, IX)</td>
          </tr>
          <tr>
            <td>Segurança, prevenção a fraudes e guarda de registros de acesso</td>
            <td>Registros de acesso</td>
            <td>Cumprimento de obrigação legal (art. 7º, II; Marco Civil, art. 15)</td>
          </tr>
          <tr>
            <td>Provar que você deu consentimento</td>
            <td>Data, versão e tipo de cada consentimento</td>
            <td>Cumprimento de obrigação legal (art. 8º, §2º)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>4. O que nós não fazemos</h2>
    <ul>
      <li>Não vendemos nem alugamos seus dados.</li>
      <li>Não usamos seus dados de saúde para publicidade.</li>
      <li>
        Não compartilhamos dados de saúde com planos de saúde, seguradoras ou empregadores, nem para obter vantagem
        econômica (art. 11, §4º).
      </li>
      <li>Não usamos cookies de rastreamento ou de publicidade.</li>
    </ul>

    <h2>5. Com quem compartilhamos</h2>
    <p>Compartilhamos apenas o necessário com empresas que operam o serviço em nosso nome (operadores):</p>
    <ul>
      <li>
        <strong>Supabase</strong> — banco de dados e autenticação, onde ficam sua conta e seus dados.
      </li>
      <li>
        <strong>Vercel</strong> — hospedagem do aplicativo.
      </li>
      <li>
        <strong>n8n e provedor de inteligência artificial</strong> — recebem a foto do rótulo ou o texto que você enviar,
        apenas para gerar a análise.
      </li>
    </ul>
    <p>
      Os estudos científicos exibidos vêm do Europe PMC e os títulos são traduzidos pelo serviço MyMemory: nenhuma
      informação sua é enviada a eles. Também podemos fornecer dados quando exigido por lei ou por ordem judicial.
    </p>

    <h2>6. Transferência internacional</h2>
    <p>
      Alguns desses provedores mantêm servidores fora do Brasil. Nesses casos, a transferência segue o art. 33 da LGPD,
      com provedores que oferecem garantias contratuais e técnicas de proteção compatíveis com a lei brasileira.
    </p>

    <h2>7. O que fica no seu aparelho</h2>
    <p>
      O app guarda no navegador (armazenamento local) apenas o necessário para funcionar: sua sessão de login, para você
      não precisar entrar toda vez, e a tradução dos títulos dos estudos, para carregar mais rápido. Ao sair da conta, a
      sessão é apagada.
    </p>

    <h2>8. Por quanto tempo guardamos</h2>
    <ul>
      <li>Seus dados ficam guardados enquanto sua conta existir.</li>
      <li>
        Ao excluir a conta, apagamos imediatamente seus dados da base ativa. Cópias de segurança dos provedores são
        substituídas no ciclo normal deles.
      </li>
      <li>Registros de acesso são mantidos por 6 meses, como determina o Marco Civil da Internet.</li>
    </ul>

    <h2>9. Seus direitos</h2>
    <p>Pelo art. 18 da LGPD, você pode, a qualquer momento e sem custo:</p>
    <ul>
      <li>confirmar se tratamos seus dados e acessá-los;</li>
      <li>corrigir dados incompletos ou desatualizados;</li>
      <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários;</li>
      <li>receber seus dados em formato estruturado (portabilidade);</li>
      <li>eliminar os dados tratados com base no seu consentimento e revogar o consentimento;</li>
      <li>saber com quem compartilhamos seus dados;</li>
      <li>saber o que acontece se você não der o consentimento.</li>
    </ul>
    <p>
      <strong>Como exercer:</strong> em <strong>Configurações → Privacidade e seus dados</strong> você baixa todos os seus
      dados e exclui sua conta. Em <strong>Meu Perfil</strong> você corrige suas informações. Para os demais pedidos,
      escreva para {LEGAL.dpoEmail}. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de
      Proteção de Dados (ANPD).
    </p>
    <p>
      <strong>Se você não der consentimento</strong> para o uso de dados de saúde, não é possível criar a conta, porque o
      AlerGica depende dessas informações para indicar o que é seguro. Revogar o consentimento equivale a excluir a conta.
    </p>

    <h2>10. Crianças e adolescentes</h2>
    <p>
      A conta só pode ser criada por maiores de 18 anos. Dados de crianças são informados pelos pais ou responsáveis, com
      o consentimento específico dado no cadastro (art. 14, §1º), e usados apenas no melhor interesse da criança: indicar
      remédios e produtos seguros.
    </p>

    <h2>11. Segurança</h2>
    <p>
      Usamos conexão criptografada (HTTPS), senhas protegidas por criptografia e regras no banco de dados que permitem a
      cada pessoa acessar apenas os próprios dados. O acesso interno é restrito a quem precisa. Se ocorrer um incidente de
      segurança que possa causar risco ou dano relevante, comunicaremos a ANPD e as pessoas afetadas (art. 48).
    </p>

    <h2>12. Mudanças nesta política</h2>
    <p>
      Podemos atualizar esta política. A versão e a data de vigência ficam no topo da página. Mudanças importantes serão
      avisadas no app e, quando a lei exigir, pediremos um novo consentimento.
    </p>

    <h2>13. Fale com a gente</h2>
    <p>
      Dúvidas sobre privacidade: <strong>{LEGAL.dpoEmail}</strong>. Veja também os{" "}
      <Link to="/termos">Termos de Uso</Link>.
    </p>
  </LegalLayout>
);

export default PrivacyPolicyPage;
