import { ContentContainer } from '@/src/components/atoms/ContentContainer';
import { Facet } from '@/src/components/atoms/Facet';

import { Stack } from '@/src/components/atoms/Stack';
import { TH1, TP, TPriceBig } from '@/src/components/atoms/TypoGraphy';
import { Button, FullWidthButton, FullWidthSecondaryButton } from '@/src/components/molecules/Button';
import { NotifyMeForm } from '@/src/components/molecules/NotifyMeForm';
import { NewestProducts } from '@/src/components/organisms/NewestProducts';
import { ProductPhotosPreview } from '@/src/components/organisms/ProductPhotosPreview';
import { RelatedProductCollections } from '@/src/components/organisms/RelatedProductCollections';
import { storefrontApiQuery } from '@/src/graphql/client';
import {
    NewestProductSelector,
    ProductDetailSelector,
    ProductDetailType,
    ProductSlugSelector,
} from '@/src/graphql/selectors';
import { getCollections } from '@/src/graphql/sharedQueries';
import { Layout } from '@/src/layouts';
import { ContextModel, localizeGetStaticPaths, makeStaticProps } from '@/src/lib/getStatic';
import { usePush } from '@/src/lib/redirect';
import { useCart } from '@/src/state/cart';
import { priceFormatter } from '@/src/util/priceFomatter';
import { translateProductFacetsNames } from '@/src/util/translateFacetsNames';
import { CurrencyCode, SortOrder } from '@/src/zeus';
import styled from '@emotion/styled';
import { Check, X } from 'lucide-react';
import { InferGetStaticPropsType } from 'next';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';

type Variant = ProductDetailType['variants'][number];

const ProductPage: React.FC<InferGetStaticPropsType<typeof getStaticProps>> = props => {
    const { addToCart } = useCart();
    const push = usePush();
    const { t } = useTranslation('common');
    const [variant, setVariant] = useState<Variant>();

    const translatedStockLevel = t('stockLevel', { returnObjects: true });
    const language = props._nextI18Next?.initialLocale || 'en';
    const variants = props.product?.variants.map(v => ({
        ...v,
        size: v.name.replace(props.product?.name || '', ''),
    }));

    const handleVariant = (variant?: Variant) => {
        if (!variant) return;
        window.history.pushState({}, '', `?variant=${variant.id}`);
        setVariant(variant);
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const variantId = urlParams.get('variant');
            if (variantId) {
                const variant = variants?.find(v => v.id === variantId);
                if (variant) handleVariant(variant);
            } else handleVariant(props.product?.variants[0]);
        }
    }, []);

    return (
        <Layout categories={props.collections}>
            <ContentContainer>
                <Main gap="5rem">
                    <ProductPhotosPreview featuredAsset={props.product?.featuredAsset} images={props.product?.assets} />
                    <StyledStack column gap="2.5rem">
                        <TH1>{props.product?.name}</TH1>
                        <FacetContainer gap="1rem">
                            {translateProductFacetsNames(language, props.product?.facetValues).map(({ id, name }) => (
                                <Facet key={id}>{name}</Facet>
                            ))}
                        </FacetContainer>
                        {variants && variants?.length > 1 ? (
                            <StyledStack gap="0.5rem">
                                {variants.map(s => (
                                    <SizeSelector
                                        key={s.id}
                                        onClick={() => handleVariant(s)}
                                        selected={s.id === variant?.id}>
                                        {s.size}
                                    </SizeSelector>
                                ))}
                            </StyledStack>
                        ) : null}
                        <Stack justifyBetween itemsCenter>
                            <Stack gap="1rem">
                                <TPriceBig>
                                    {priceFormatter(
                                        variant?.priceWithTax || 0,
                                        variant?.currencyCode || CurrencyCode.USD,
                                    )}
                                </TPriceBig>
                                <TPriceBig>{props.product?.variants[0].currencyCode}</TPriceBig>
                            </Stack>
                        </Stack>
                        <Stack gap="1rem">
                            <StockInfo outOfStock={variant?.stockLevel === 'outOfStock'} itemsCenter gap="0.25rem">
                                {variant?.stockLevel === 'outOfStock' ? <X /> : <Check size="1.75rem" />}
                                <TP>
                                    {translatedStockLevel[variant?.stockLevel as keyof typeof translatedStockLevel]}
                                </TP>
                            </StockInfo>

                            {variant?.stockLevel === 'outOfStock' ? <NotifyMeForm /> : null}
                        </Stack>
                        <TP>{props.product?.description}</TP>
                        <Stack w100 gap="2.5rem" justifyBetween column>
                            <FullWidthSecondaryButton
                                disabled={variant?.stockLevel === 'outOfStock'}
                                onClick={() => variant?.id && addToCart(variant.id, 1)}>
                                {t('add-to-cart')}
                            </FullWidthSecondaryButton>
                            <FullWidthButton
                                disabled={variant?.stockLevel === 'outOfStock'}
                                onClick={() => {
                                    if (variant?.id && variant?.stockLevel !== 'outOfStock') {
                                        addToCart(variant.id, 1);
                                        push('/checkout');
                                    }
                                }}>
                                {t('buy-now')}
                            </FullWidthButton>
                        </Stack>
                    </StyledStack>
                </Main>
                <RelatedProductCollections collections={props.product?.collections} />
                <NewestProducts products={props.newestProducts.products.items} />
            </ContentContainer>
        </Layout>
    );
};

const StockInfo = styled(Stack)<{ outOfStock?: boolean }>`
    white-space: nowrap;
    color: ${p => (p.outOfStock ? p.theme.error : 'inherit')};
    width: max-content;
    @media (min-width: 1024px) {
        width: 100%;
    }
`;

const StyledStack = styled(Stack)`
    justify-content: center;
    align-items: center;
    @media (min-width: 1024px) {
        justify-content: flex-start;
        align-items: flex-start;
    }
`;

const FacetContainer = styled(Stack)`
    flex-wrap: wrap;
    justify-content: center;
    @media (min-width: 1024px) {
        justify-content: flex-start;
    }
`;

const SizeSelector = styled(Button)<{ selected: boolean }>`
    border: 1px solid ${p => p.theme.gray(500)};
    background: ${p => p.theme.gray(0)};
    color: ${p => p.theme.gray(900)};
    :hover {
        background: ${p => p.theme.gray(500)};
        color: ${p => p.theme.gray(0)};
    }
    ${p =>
        p.selected &&
        `
        background: ${p.theme.gray(1000)};
        color: ${p.theme.gray(0)};
    `}
`;
const Main = styled(Stack)`
    padding: 1%.5 0;
    flex-direction: column;
    align-items: center;
    @media (min-width: 1024px) {
        flex-direction: row;
        padding: 4rem 0;
    }
    border-bottom: 1px solid ${({ theme }) => theme.gray(100)};
`;

export const getStaticPaths = async () => {
    const resp = await storefrontApiQuery({
        products: [{}, { items: ProductSlugSelector }],
    });
    const paths = localizeGetStaticPaths(
        resp.products.items.map(product => ({
            params: { id: product.id, slug: product.slug },
        })),
    );
    return { paths, fallback: false };
};

export const getStaticProps = async (context: ContextModel<{ slug?: string }>) => {
    const { slug } = context.params || {};
    const collections = await getCollections();
    const newestProducts = await storefrontApiQuery({
        products: [{ options: { take: 10, sort: { createdAt: SortOrder.DESC } } }, { items: NewestProductSelector }],
    });

    const response =
        typeof slug === 'string'
            ? await storefrontApiQuery({
                  product: [{ slug }, ProductDetailSelector],
              })
            : undefined;
    const r = await makeStaticProps(['common'])(context);

    const returnedStuff = {
        slug: context.params?.slug,
        product: response?.product,
        collections: collections,
        newestProducts: newestProducts,
        ...r.props,
    };
    return {
        props: returnedStuff,
        revalidate: 10,
    };
};

export default ProductPage;
