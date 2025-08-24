from flask import Flask, request, jsonify
from flask_cors import CORS
import requests as req
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

USERAGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
HEADERS = {"User-Agent": USERAGENT}

NOT_RESULT = "<h1 style='color:#ff0422;text-align:center'>Aucun résultat trouvé</h1>"

# -----------------------------------------------------------------------------
# AQUI: Classe History (igual ao seu código original)
# -----------------------------------------------------------------------------
import json
import os

class History:
    FIREBASE_URL = "https://mauriciodallonder-64688-default-rtdb.firebaseio.com/history.json"

    @classmethod
    def get_history_data(cls):
        response = req.get(cls.FIREBASE_URL)
        if response.ok:
            data = response.json()
            return data if isinstance(data, dict) else {}
        return {}

    @classmethod
    def add_new_item(cls, word, translation):
        data = cls.get_history_data()
        if word not in data:
            data[word] = translation
            cls.save_new_update(data)
            return True
        return False

    @classmethod
    def save_new_update(cls, data):
        req.put(cls.FIREBASE_URL, json.dumps(data))

    @classmethod
    def delete_item(cls, word):
        data = cls.get_history_data()
        if word in data:
            del data[word]
            cls.save_new_update(data)
            return True
        return False

    @classmethod
    def delete_all(cls):
        # Para limpar completamente:
        empty_data = {}
        req.put(cls.FIREBASE_URL, json.dumps(empty_data))
# -----------------------------------------------------------------------------

def extract_examples(html_content: str) -> list:
    """
    Função auxiliar para extrair as frases de exemplo do HTML retornado pelo Larousse.
    Ela encontra todas as tags com a classe 'ExempleDefinition' e retorna seu texto.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    examples = []

    # Encontrar todas as tags que tenham a classe ExempleDefinition:
    for example_tag in soup.find_all("span", class_="ExempleDefinition"):
        # .get_text() remove as tags internas, se existirem, e deixa só o texto.
        examples.append(example_tag.get_text(strip=True))

    return examples

def get_definition(word):
    """
    Recupera a definição do Larousse para a palavra, fazendo parse do HTML.
    Em seguida, retorna o HTML inteiro ou a mensagem "Aucun résultat trouvé" + as sugestões,
    bem como False (indicando que não veio do histórico).
    """
    try:
        URL = "https://www.larousse.fr/dictionnaires/francais/" + word.lower()
        response = req.get(URL, headers=HEADERS)
        soup = BeautifulSoup(response.text, "html.parser")
        div = soup.find("div", attrs={"id": "definition"})
        result = NOT_RESULT
        if div:
            result = str(div)
        else:
            content = soup.find("section", attrs={"class": "corrector"})
            if content:
                # Aqui, você pode concatenar o NOT_RESULT com o html da seção corrector
                result = NOT_RESULT + str(content)

        return result, False
    except req.exceptions.ConnectionError:
        return "A connection error occurred.", False
    except Exception as e:
        print(f"An error occurred: {e}")
        return "An error occurred while fetching the definition.", False
        
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/api/definitions', methods=['GET'])
def definitions():
    """
    Endpoint que retorna a definição em HTML da palavra
    (ou do histórico, se já existir), junto com uma lista
    de exemplos extraídos (ExempleDefinition).
    """
    word = request.args.get('word')
    if not word:
        return jsonify({"error": "Palavra não especificada."}), 400

    # 1) Verifica se a palavra já está no histórico.
    history_data = History.get_history_data()
    if word in history_data:
        definition_html = history_data[word]
        examples = extract_examples(definition_html)
        return jsonify({
            "definition": definition_html,
            "examples": examples
        }), 200

    # 2) Se não estiver no histórico, faz a busca via get_definition.
    definition_html, _ = get_definition(word)
    History.add_new_item(word, definition_html)

    # 3) Extrair exemplos do HTML recebido.
    examples = extract_examples(definition_html)

    return jsonify({
        "definition": definition_html,
        "examples": examples
    }), 200


@app.route('/api/history', methods=['GET'])
def history():
    try:
        history_data = History.get_history_data()
        return jsonify(history_data), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": f"Não foi possível recuperar o histórico. Detalhe do erro: {str(e)}"}), 500

@app.route('/api/history/<word>', methods=['DELETE'])
def delete_history_item(word):
    try:
        success = History.delete_item(word)
        if success:
            return jsonify({"message": "Item deletado com sucesso."}), 200
        else:
            return jsonify({"error": "Item não encontrado no histórico."}), 404
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Não foi possível deletar o item do histórico."}), 500

@app.route('/api/history', methods=['DELETE'])
def clear_history():
    try:
        History.delete_all()
        return jsonify({"message": "Histórico limpo com sucesso."}), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Não foi possível limpar o histórico."}), 500

@app.route('/')
def home():
    return 'Hello, World!'

# --- INÍCIO DO NOVO CÓDIGO ---

# Carrega o dicionário na memória do servidor UMA ÚNICA VEZ.
# Isso é muito mais eficiente do que ler o arquivo a cada busca.
word_list = []
try:
    # O caminho é relativo ao arquivo index.py dentro da pasta /api
    dict_path = os.path.join(os.path.dirname(__file__), 'dic.json')
    with open(dict_path, 'r', encoding='utf-8') as f:
        # Carregamos apenas as chaves (palavras), que é tudo o que precisamos
        word_list = list(json.load(f).keys())
except Exception as e:
    # Se houver um erro, registramos no log do servidor
    print(f"ERRO CRÍTICO: Não foi possível carregar o dic.json. Erro: {e}")

# Novo endpoint para a busca com autocomplete
@app.route('/api/search')
def search_words():
    # Pega o termo de busca da URL (ex: /api/search?term=bon)
    term = request.args.get('term', '').lower()

    # Não busca se o termo for muito curto, para economizar recursos
    if not term or len(term) < 2:
        return jsonify([])

    # Filtra a lista de palavras para encontrar aquelas que começam com o termo
    # A busca é feita na lista que já está na memória, sendo extremamente rápida.
    suggestions = [word for word in word_list if word.lower().startswith(term)]

    # Retorna no máximo as 10 primeiras sugestões
    return jsonify(suggestions[:10])

# --- FIM DO NOVO CÓDIGO ---

@app.route('/about')
def about():
    return 'About'

if __name__ == '__main__':
    app.run(debug=True)