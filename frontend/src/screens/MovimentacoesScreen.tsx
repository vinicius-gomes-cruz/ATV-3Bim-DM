import { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { movimentacaoApi, produtoApi } from '../api/api';
import { Movimentacao, Produto, TipoMovimentacao } from '../types';
import { BotaoSair } from '../components/BotaoSair';

export function MovimentacoesScreen() {
  const navigation = useNavigation();
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <BotaoSair /> });
  }, [navigation]);

  async function carregar() {
    const [movimentacoesData, produtosData] = await Promise.all([
      movimentacaoApi.listar(),
      produtoApi.listar(),
    ]);
    setMovimentacoes(movimentacoesData);
    setProdutos(produtosData);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ListaMovimentacoes movimentacoes={movimentacoes} />
      <FormularioMovimentacao produtos={produtos} onMovimentacaoCriada={carregar} />
    </ScrollView>
  );
}

function ListaMovimentacoes({ movimentacoes }: { movimentacoes: Movimentacao[] }) {
  const formatarDataHora = (dataIso: string) =>
    new Date(dataIso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  return (
    <View>
      <Text style={styles.titulo}>Movimentações</Text>

      {movimentacoes.length === 0 ? (
        <Text style={styles.mensagemVazia}>Nenhuma movimentação registrada.</Text>
      ) : (
        <View style={styles.tabela}>
          <View style={[styles.linha, styles.cabecalho]}>
            <Text style={[styles.celula, styles.celulaCabecalho, { flex: 2 }]}>Data/Hora</Text>
            <Text style={[styles.celula, styles.celulaCabecalho, { flex: 2 }]}>Produto</Text>
            <Text style={[styles.celula, styles.celulaCabecalho]}>Tipo</Text>
            <Text style={[styles.celula, styles.celulaCabecalho]}>Qtd.</Text>
          </View>

          {movimentacoes.map((movimentacao) => {
            const ehEntrada = movimentacao.tipo === 'ENTRADA';
            return (
              <View key={movimentacao.id} style={styles.linha}>
                <Text style={[styles.celula, { flex: 2 }]}>{formatarDataHora(movimentacao.criadoEm)}</Text>
                <Text style={[styles.celula, { flex: 2 }]}>{movimentacao.produto.nome}</Text>
                <View style={styles.celula}>
                  <Text style={[styles.tipoTag, ehEntrada ? styles.tagEntrada : styles.tagSaida]}>
                    {ehEntrada ? 'Entrada' : 'Saída'}
                  </Text>
                </View>
                <Text style={styles.celula}>{movimentacao.quantidade}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function FormularioMovimentacao({
  produtos,
  onMovimentacaoCriada,
}: {
  produtos: Produto[];
  onMovimentacaoCriada: () => void;
}) {
  const [produtoId, setProdutoId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoMovimentacao | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [erro, setErro] = useState('');

  async function handleSubmit() {
    if (produtoId === null || tipo === null || !quantidade.trim()) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    const quantidadeNumero = Number(quantidade);
    if (!Number.isInteger(quantidadeNumero) || quantidadeNumero <= 0) {
      setErro('Informe uma quantidade válida.');
      return;
    }

    setErro('');

    try {
      await movimentacaoApi.criar({ produtoId, tipo, quantidade: quantidadeNumero });
      setProdutoId(null);
      setTipo(null);
      setQuantidade('');
      onMovimentacaoCriada();
    } catch (err: any) {
      setErro(err.response?.data?.message ?? 'Não foi possível registrar a movimentação.');
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.subtitulo}>Nova Movimentação</Text>

      <Text style={styles.label}>Produto</Text>
      {produtos.length === 0 ? (
        <Text style={styles.mensagemVazia}>Cadastre produtos para movimentar o estoque.</Text>
      ) : (
        <View style={styles.grupoOpcoes}>
          {produtos.map((produto) => {
            const selecionado = produtoId === produto.id;
            return (
              <TouchableOpacity
                key={produto.id}
                style={[styles.opcao, selecionado && styles.opcaoSelecionada]}
                onPress={() => setProdutoId(produto.id)}
              >
                <Text style={[styles.opcaoTexto, selecionado && styles.opcaoTextoSelecionada]}>
                  {produto.nome} (Estoque: {produto.quantidade})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.grupoOpcoes}>
        <TouchableOpacity
          style={[styles.opcao, tipo === 'ENTRADA' && styles.opcaoSelecionada]}
          onPress={() => setTipo('ENTRADA')}
        >
          <Text style={[styles.opcaoTexto, tipo === 'ENTRADA' && styles.opcaoTextoSelecionada]}>
            Entrada
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.opcao, tipo === 'SAIDA' && styles.opcaoSelecionada]}
          onPress={() => setTipo('SAIDA')}
        >
          <Text style={[styles.opcaoTexto, tipo === 'SAIDA' && styles.opcaoTextoSelecionada]}>
            Saída
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Quantidade"
        value={quantidade}
        onChangeText={setQuantidade}
        keyboardType="number-pad"
      />

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <TouchableOpacity style={styles.botao} onPress={handleSubmit}>
        <Text style={styles.botaoTexto}>Registrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  subtitulo: { fontWeight: '600', marginBottom: 8 },
  mensagemVazia: { color: '#666', marginBottom: 12 },
  tabela: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, marginBottom: 8 },
  linha: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', padding: 8 },
  cabecalho: { backgroundColor: '#f5f5f5' },
  celula: { flex: 1, fontSize: 12, justifyContent: 'center' },
  celulaCabecalho: { fontWeight: '600' },
  tipoTag: {
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tagEntrada: { backgroundColor: '#dcfce7', color: '#166534' },
  tagSaida: { backgroundColor: '#fee2e2', color: '#991b1b' },
  form: { marginTop: 16 },
  label: { fontWeight: '600', marginBottom: 8 },
  grupoOpcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  opcao: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  opcaoSelecionada: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  opcaoTexto: { color: '#333' },
  opcaoTextoSelecionada: { color: '#1d4ed8', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 8 },
  erro: { color: 'red', marginBottom: 8 },
  botao: { backgroundColor: '#2563eb', padding: 10, borderRadius: 6 },
  botaoTexto: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
