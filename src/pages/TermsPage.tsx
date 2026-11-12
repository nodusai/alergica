/**
 * Termos de Uso. Texto-modelo — revise com assessoria jurídica e preencha os dados da empresa
 * em src/config/legal.ts antes de publicar. Ao mudar o conteúdo, aumente LEGAL.termsVersion.
 */
import { Link } from "react-router-dom";
import LegalLayout from "@/components/LegalLayout";
import { LEGAL } from "@/config/legal";

const TermsPage = () => (
  <LegalLayout
    title="Termos de Uso"
    version={LEGAL.termsVersion}
    intro={
      <>
        Estes termos são o acordo entre você e {LEGAL.controllerName} para o uso do AlerGica. Ao criar sua conta, você
        declara que leu e concorda com eles.
      </>
    }
  >
    <h2>1. O que é o AlerGica</h2>
    <p>
      O AlerGica é um aplicativo informativo que ajuda pessoas com Alergia à Proteína do Leite de Vaca (APLV) e suas
      famílias a identificar derivados do leite em medicamentos e produtos, a partir de bulas públicas, rótulos e análises
      automatizadas.
    </p>

    <h2>2. Aviso importante de saúde</h2>
    <div className="callout">
      <p>
        <strong>O AlerGica não substitui o médico nem o farmacêutico.</strong> As classificações (seguro, atenção e
        risco), as alternativas sugeridas e as análises de rótulo são informativas e podem conter erros ou estar
        desatualizadas — por exemplo, quando o fabricante muda a fórmula. Confirme sempre com um profissional de saúde
        antes de usar qualquer medicamento ou produto. Em caso de reação alérgica, procure atendimento imediato ou ligue
        para o SAMU (192).
      </p>
    </div>

    <h2>3. Sua conta</h2>
    <ul>
      <li>Você precisa ter 18 anos ou mais para criar uma conta.</li>
      <li>As informações do cadastro devem ser verdadeiras e atualizadas.</li>
      <li>Sua senha é pessoal. Avise-nos se suspeitar de uso indevido da sua conta.</li>
      <li>Você pode excluir sua conta a qualquer momento em Configurações.</li>
    </ul>

    <h2>4. O que você pode e não pode fazer</h2>
    <p>Você pode usar o AlerGica para fins pessoais e para orientar seus pacientes ou familiares. Não é permitido:</p>
    <ul>
      <li>copiar, extrair em massa ou revender o catálogo e as análises;</li>
      <li>tentar acessar dados de outras pessoas ou contornar as medidas de segurança;</li>
      <li>fazer engenharia reversa do aplicativo ou sobrecarregar o serviço com acessos automatizados;</li>
      <li>enviar conteúdo ilegal, ofensivo ou com dados de terceiros sem autorização.</li>
    </ul>

    <h2>5. Propriedade intelectual</h2>
    <p>
      A marca AlerGica, o mascote, o design, o software e a organização do catálogo pertencem a {LEGAL.controllerName}.
      Os nomes e marcas de medicamentos e produtos pertencem aos seus fabricantes, e as bulas são documentos públicos
      publicados por eles.
    </p>

    <h2>6. Conteúdo de terceiros</h2>
    <p>
      O app tem links para bulas, estudos científicos e outras fontes externas. Não controlamos esses conteúdos e não
      respondemos por eles.
    </p>

    <h2>7. Disponibilidade e mudanças no serviço</h2>
    <p>
      Trabalhamos para manter o AlerGica sempre disponível, mas podem ocorrer interrupções para manutenção ou por falhas
      de terceiros. Podemos incluir, mudar ou retirar funcionalidades, avisando com antecedência quando a mudança for
      relevante.
    </p>

    <h2>8. Responsabilidade</h2>
    <p>
      Respondemos pelo serviço nos limites do Código de Defesa do Consumidor. Como as informações são de apoio e não
      substituem orientação profissional (item 2), não nos responsabilizamos por decisões de saúde tomadas sem consultar
      um médico ou farmacêutico.
    </p>

    <h2>9. Suspensão e encerramento</h2>
    <p>
      Você pode encerrar sua conta quando quiser. Podemos suspender ou encerrar contas que violem estes termos, avisando o
      motivo, exceto quando a lei impedir.
    </p>

    <h2>10. Privacidade</h2>
    <p>
      O uso dos seus dados está descrito na <Link to="/privacidade">Política de Privacidade</Link>, que faz parte destes
      termos.
    </p>

    <h2>11. Mudanças nestes termos</h2>
    <p>
      Podemos atualizar estes termos. A versão e a data de vigência ficam no topo da página, e mudanças importantes serão
      avisadas no app.
    </p>

    <h2>12. Lei aplicável</h2>
    <p>
      Estes termos seguem as leis brasileiras. Fica eleito o foro do domicílio do usuário para resolver qualquer questão.
    </p>

    <h2>13. Contato</h2>
    <p>
      Fale com a gente pelo botão de suporte no app ou pelo e-mail <strong>{LEGAL.dpoEmail}</strong>.
    </p>
  </LegalLayout>
);

export default TermsPage;
