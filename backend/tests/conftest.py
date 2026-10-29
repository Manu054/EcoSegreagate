import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import Base, engine

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def sample_valid_image_bytes():
    img = Image.new("RGB", (224, 224), color=(34, 139, 34))  # Forest green
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

@pytest.fixture
def sample_corrupted_image_bytes():
    return b"NOT_A_REAL_IMAGE_DATA_FILE_CORRUPTED_BYTES"
